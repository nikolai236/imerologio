import type { PrismaClient } from "@prisma/client";
import type { TradeScoringData, DbLabel, ScoreSet, Level } from "../../../shared/trades.types";
import tradeRepository from "../database/trades";
import labelRepository from "../database/labels";
import Bitset, { and, countTrailingZeros, popcount } from "../../lib/bitset";

type Means = {
	total: number;
	muAll: number;
	profitFactor: number | null;
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
	risk: number;
};

const EPS = 1e-9;

const computeMeans = (trades: TradeScoringData[]): Means => {
	let sum = 0, absSum = 0, profit = 0, loss = 0;
	
	for (const { pnl } of trades) {
		if (isNaN(pnl)) throw new Error("NaN pnl");

		if (pnl > 0) {
			profit += pnl;
		} else {
			loss += Math.abs(pnl);
		}

		sum += pnl;
		absSum += Math.abs(pnl);
	}

	const count = trades.length;
	return {
		total: sum,
		muAll: count ? sum / count : 0,
		profitFactor: loss  ? profit / loss : null,
		avgAbsPnl: count ? absSum / count : 1,
	};
};

const computeRedundancyIndex = (
	batchMean: number | null,
	prevKeysMeans: Map<string, number>,
	candIds: number[]
) => {
	let bestMean: number = -Infinity;
	for (let r = 0; r < candIds.length; r++) {
		let key = "";
		for (let h = 0; h < candIds.length; h++) {
			if (r === h) continue;
			key += (key ? "," : "") + candIds[h]; 
		}

		const subsetMean = prevKeysMeans.get(key);
		if (subsetMean == null) continue;
		if (subsetMean > bestMean) bestMean = subsetMean!;
	}

	if (bestMean == -Infinity) return null;

	const redundancy = Math.abs(batchMean ?? 0) < EPS ?
		null : bestMean / (batchMean ?? 0);

	return redundancy;
}

const getCombinedScore = (support: number, totalPnl: number, risk: number) => {
	const supportWeight = Math.log1p(support);
	const edge = totalPnl >= 0
		? totalPnl / risk
		: totalPnl * risk;

	return Math.log1p(Math.abs(edge)) * Math.sign(edge);
};

const scoreBitset = (set: Bitset, pnls: number[], risks: number[]) => {
	let support = 0, sum = 0, profit = 0, loss = 0, riskSum = 0;

	for (let j = 0; j < set.array.length; j++) {
		let word = set.array[j];
		if (word == 0) continue;

		support += popcount(word);

		while (word != 0) {
			const lsb = word & -word;
			const bit = countTrailingZeros(lsb);

			const i = (j << 5) + bit;

			sum += pnls[i];
			riskSum += risks[i];

			if (pnls[i] > 0) {
				profit += pnls[i];
			} else {
				loss += Math.abs(pnls[i]);
			}

			word ^= lsb;
		}
	}

	return {
		support,
		averageRisk: riskSum / support,
		totalPnl: sum,
		profitFactor: profit ? loss ? profit / loss : null : profit,
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
	risks: number[],
	minSupport: number,
) => {
	const out = labelIds.reduce<WorkingScoreSet[]>((prev, id) => {
		const bitset = labelIdsBitsets.get(id);
		if (bitset == null) return prev;

		const {
			support,
			muIn,
			profitFactor,
			totalPnl,
			averageRisk
		} = scoreBitset(bitset, pnls, risks);
		if (support < minSupport) return prev;

		const combined = getCombinedScore(support, totalPnl, averageRisk);

		prev.push({
			risk: averageRisk,
			labelIds: [id],
			bitset,
			support,
			redundancy: null,
			muIn: muIn ?? 0,
			profitFactor,
			totalPnl,
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
	risks: number[],
	minSupport: number,
) => {
	const prefixLen = k - 2;

	const prevKeysMeans = new Map(prevLevel.map(scoreSet =>
		[getIdsKey(scoreSet.labelIds), scoreSet.muIn]
	));

	const passesAprioriPrune = (candIds: number[]) => {
		for (let r = 0; r < candIds.length; r++) {
			let key = "";
			for (let i = 0; i < candIds.length; i++) {
				if (i === r) continue;
				key += (key ? "," : "") + candIds[i];
			}
			if (!prevKeysMeans.has(key)) return false;
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

				const {
					support,
					profitFactor,
					muIn,
					totalPnl,
					averageRisk
				} = scoreBitset(tempBitset, pnls, risks);
				if (support < minSupport) continue;

				const combined = getCombinedScore(support, totalPnl, averageRisk);

				const redundancy = computeRedundancyIndex(
					muIn, prevKeysMeans, candIds
				);

				out.push({
					labelIds: candIds,
					bitset: cloneBitset(tempBitset),
					support,
					risk: averageRisk,
					redundancy,
					profitFactor,
					muIn: muIn ?? 0,
					totalPnl,
					score: combined,
				});
			}
		}
	}

	return out;
}

const DEFAULTS: Required<Options> = {
	minSupportAbs: 0,
	minSupportFrac: 1 / 10,
	maxItemsetsPerLevel: 5000,
	maxLevels: 10,
} as const;

const scoringService = (db: PrismaClient) => {
	const { getTradeScoringData   } = tradeRepository(db);
	const { getLabelsWithTradeIds } = labelRepository(db);

	const getScores = async (filterBe: boolean, beThreshold: number) => {
		const options = { ...DEFAULTS };

		const labels = await getLabelsWithTradeIds();
		let trades = await getTradeScoringData();

		if (filterBe) {
			trades = trades.filter(({ pnl }) =>
				Math.abs(pnl) >= beThreshold
			);
		}
		
		const pnls = trades.map(({ pnl }) => pnl);
		const risks = trades.map(({ risk }) => risk);

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
			risks,
			minSupport
		);

		let sorted = [...current].sort((a, b) => b.score - a.score);
		sorted = sorted.slice(0, options.maxItemsetsPerLevel);

		const scoreSets = sorted.map<ScoreSet>((set) => ({
			labelIds: set.labelIds,
			support: set.support,
			profitFactor: set.profitFactor,
			redundancy: null,
			muIn: set.muIn,
			totalPnl: set.totalPnl,
			score: set.score,
		}));

		levels.push(scoreSets);

		for (let k = 2; k <= options.maxLevels; k++) {
			if (current.length <= 1) break;

			const next = buildNextLevel(current, k, pnls, risks, minSupport);
			if (next.length == 0) break;

			let sorted = [...next].sort((a, b) => b.score - a.score);
			sorted = sorted.slice(0, options.maxItemsetsPerLevel);

			const scoreSets = sorted.map<ScoreSet>((set) => ({
				labelIds: set.labelIds,
				support: set.support,
				muIn: set.muIn,
				profitFactor: set.profitFactor,
				redundancy: set.redundancy,
				totalPnl: set.totalPnl,
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
		} as const;
	};

	return getScores;
};

export default scoringService;