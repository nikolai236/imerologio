import type { PrismaClient } from "@prisma/client";
import type { TradeScoringData, DbLabel, ScoreSet, Level } from "../../../shared/trades.types";
import useTrades from "../database/trades";
import useLabels from "../database/labels";
import Bitset, { and, countTrailingZeros, popcount } from "../../lib/bitset";

type Means = {
	muAll: number;
	avgAbsPnl: number;
};

type Options = {
	minSupportAbs?: number;
	minSupportFrac?: number;

	maxItemsetsPerLevel?: number;
	maxLevels?: number;
};

type WorkingScoreSet = ScoreSet & {
	bitset: Bitset;
	muIn: number | null;
	upliftPnl: number | null;
};

const EPS = 1e-9;

const computeMeans = (trades: TradeScoringData[]): Means => {
	let sum = 0, absSum = 0;
	
	for (const { pnl } of trades) {
		if (isNaN(pnl)) throw new Error("NaN pnl");

		sum += pnl;
		absSum += Math.abs(pnl);
	}

	const count = trades.length;
	return {
		muAll:     count ? sum / count : 0,
		avgAbsPnl: count ? absSum / count : 1,
	};
};

const getCombinedScore = (support: number, upliftPnl: number | null, means: Means) => {
	const normal = (upliftPnl ?? 0) / (means.avgAbsPnl + EPS);
	const supportWeight = Math.log1p(support);

	return supportWeight * (Math.abs(normal));
};

const scoreBitset = (set: Bitset, pnls: number[]) => {
	let support = 0, sum = 0;

	for (let j = 0; j < set.array.length; j++) {
		let word = set.array[j];
		if (word == 0) continue;

		support += popcount(word);

		while (word != 0) {
			const lsb = word & -word;
			const bit = countTrailingZeros(lsb);

			const i = (j << 5) + bit;
			sum += pnls[i];

			word ^= lsb;
		}
	}

	return {
		support,
		muIn: support ? sum / support : null,
	};
};

const generateBitsets = (labels: DbLabel[], trades: TradeScoringData[]) => {
	const tradeIndex = new Map(trades.map((t, i) => [t.id, i]));

	const labelIdBitset = labels.reduce((prev, label) => {
		const len = trades.length;
		const bitset = label.tradeIds
			.map((id) => tradeIndex.get(id))
			.filter((i): i is number => i != null)
			.reduce((prev, i) => prev.setBit(i), new Bitset(len));

		prev.set(label.id, bitset);
		return prev;
	}, new Map<number, Bitset>());

	return labelIdBitset;
};

const buildFirstLevel = (
	labelIds: number[],
	labelIdsBitsets: Map<number, Bitset>,
	pnls: number[],
	means: Means,
	minSupport: number,
) => {
	const out = labelIds.reduce<WorkingScoreSet[]>((prev, id) => {
		const bitset = labelIdsBitsets.get(id);
		if (bitset == null) return prev;

		const score = scoreBitset(bitset, pnls);
		if (score.support < minSupport) return prev;

		const upliftPnl = score.muIn != null ?
			(score.muIn - means.muAll) : null;

		const combined = getCombinedScore(
			score.support, upliftPnl, means
		);

		prev.push({
			labelIds: [id],
			bitset,
			support: score.support,
			muIn: score.muIn ?? 0,
			upliftPnl: upliftPnl ?? 0,
			score: combined,
		});

		return prev;
	}, []);

	return out;
};

const getIdsKey = (ids: number[]) => ids.join(",");

const getCommonPrefixKey = (ids: number[], len: number) =>
	ids.slice(0, len).join(",");

const buildNextLevel = (
	prevLevel: WorkingScoreSet[],
	k: number,
	pnls: number[],
	means: Means,
	minSupport: number,
) => {
	const prefixLen = k - 2;

	const prevKeys = new Set(prevLevel.map(
		scoreSet => getIdsKey(scoreSet.labelIds)
	));

	const passesAprioriPrune = (candIds: number[]) => {
		for (let r = 0; r < candIds.length; r++) {
			let key = "";
			for (let i = 0; i < candIds.length; i++) {
				if (i === r) continue;
				key += (key ? "," : "") + candIds[i];
			}
			if (!prevKeys.has(key)) return false;
		}
		return true;
	};

	const groups = prevLevel.reduce((map, set) => {
		const key = getCommonPrefixKey(set.labelIds, prefixLen);
		const group = map.get(key);

		if (group != null) group.push(set);
		else map.set(key, [set]);

		return map;
	}, new Map<string, WorkingScoreSet[]>);

	const visited = new Set<string>();
	const out: WorkingScoreSet[] = [];

	const tempBitset = new Bitset(pnls.length);

	const cloneBitset = (src: Bitset) => {
		const ret = new Bitset(pnls.length);
		ret.array.set(src.array);
		return ret;
	};

	for (const [, group] of groups) {
		for (let i = 0; i < group.length; i++) {
			for (let j = i + 1; j < group.length; j++) {
				const a = group[i];
				const b = group[j];

				const lastA = a.labelIds[a.labelIds.length - 1];
				const lastB = b.labelIds[b.labelIds.length - 1];
				if (lastA === lastB) continue;

				const candIds = lastA < lastB ?
					a.labelIds.concat(lastB) : b.labelIds.concat(lastA);

				if (candIds.length !== k) continue;

				const key = getIdsKey(candIds);
				if (visited.has(key)) {
					console.error("Duplicates produced");
					continue;
				}

				visited.add(key);

				if (!passesAprioriPrune(candIds)) continue;

				and(a.bitset, b.bitset, tempBitset);

				const score = scoreBitset(tempBitset, pnls);
				if (score.support < minSupport) continue;

				const upliftPnl = score.muIn != null ?
					score.muIn - means.muAll : null;

				const combined = getCombinedScore(
					score.support, upliftPnl, means
				);

				out.push({
					labelIds: candIds,
					bitset: cloneBitset(tempBitset),
					support: score.support,
					muIn: score.muIn ?? 0,
					upliftPnl: upliftPnl ?? 0,
					score: combined,
				});
			}
		}
	}

	return out;
}

const DEFAULTS: Required<Options> = {
	minSupportAbs: 2,
	minSupportFrac: 0,
	maxItemsetsPerLevel: 5000,
	maxLevels: 10,
} as const;

const useScoringService = (db: PrismaClient) => {
	const { getTradeScoringData   } = useTrades(db);
	const { getLabelsWithTradeIds } = useLabels(db);

	const getScores = async () => {
		const options = { ...DEFAULTS };

		const labels = await getLabelsWithTradeIds();
		const trades = await getTradeScoringData();

		const pnls = trades.map(({ pnl }) => pnl);
		const means = computeMeans(trades);

		const minSupport = Math.max(
			options.minSupportAbs,
			Math.ceil(options.minSupportFrac * trades.length)
		);

		const labelIdsBitsets = generateBitsets(labels, trades);

		const labelIds = labels.map(({ id }) => id);
		const levels: Level[] = [];

		let current = buildFirstLevel(
			labelIds,
			labelIdsBitsets,
			pnls,
			means,
			minSupport
		);

		let sorted = [...current].sort((a, b) => b.score - a.score);
		sorted = sorted.slice(0, options.maxItemsetsPerLevel);

		const scoreSets = sorted.map<ScoreSet>((set) => ({
			labelIds: set.labelIds,
			support: set.support,
			muIn: set.muIn,
			upliftPnl: set.upliftPnl,
			score: set.score,
		}));

		levels.push(scoreSets);

		for (let k = 2; k <= options.maxLevels; k++) {
			if (current.length <= 1) break;

			let next = buildNextLevel(current, k, pnls, means, minSupport);
			if (next.length == 0) break;

			let sorted = [...next].sort((a, b) => b.score - a.score);
			sorted = sorted.slice(0, options.maxItemsetsPerLevel);

			const scoreSets = sorted.map<ScoreSet>((set) => ({
				labelIds: set.labelIds,
				support: set.support,
				muIn: set.muIn,
				upliftPnl: set.upliftPnl,
				score: set.score,
			}));

			levels.push(scoreSets);

			current = next;
		}

		return {
			means,
			minSupport,
			tradeCount: trades.length,
			levels,
		};
	};

	return getScores;
};

export default useScoringService;