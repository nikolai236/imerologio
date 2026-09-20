import { PrismaClient } from "@prisma/client";
import tradeRepository from "../database/trades";
import labelRepository from "../database/labels";
import { generateBitsets, scoreBitset } from "./scoring";
import Bitset, { and, andNot } from "../../lib/bitset";
import { ValidationError } from "../errors";
import { ComparisonEntry, ComparisonReport } from "../../../shared/trades.types";

const useBitsets = (labelIds: number[], labelIdsBitsets: Map<number, Bitset>) => {
	const prefix: Bitset[] = [];
	const suffix: Bitset[] = [];

	prefix[0] = labelIdsBitsets.get(labelIds[0])!.copy();

	for (let i = 1; i < labelIds.length; i++) {
		prefix[i] = prefix[i - 1].copy();
		and(prefix[i], labelIdsBitsets.get(labelIds[i])!, prefix[i]);
	}

	const last = labelIds.length - 1;
	suffix[last] = labelIdsBitsets.get(labelIds[last])!.copy();

	for (let i = last - 1; i >= 0; i--) {
		suffix[i] = suffix[i + 1].copy();
		and(suffix[i], labelIdsBitsets.get(labelIds[i])!, suffix[i]);
	}

	const createBitsetForIds = (i: number) => {
		if (i === 0) return suffix[1].copy();
		if (i === last) return prefix[i - 1].copy();

		const ret = prefix[i - 1].copy();
		and(ret, suffix[i + 1], ret);

		return ret;
	};

	return {
		originalBitset: suffix[0].copy(),
		createBitsetForIds,
	} as const;
};

const generateEstimate = (generalized: ComparisonEntry[]): ComparisonEntry => {
	let weightSum = 0;

	let winRate = 0;
	let averageRisk = 0;
	let muIn = 0;
	let profitFactor = 0;

	for (const entry of generalized) {
		if (entry.support === 0) continue;

		const weight = Math.sqrt(entry.support);
		weightSum += weight;

		winRate += entry.winRate * weight;
		averageRisk += entry.averageRisk * weight;
		muIn += (entry.muIn ?? 0) * weight;

		if (entry.profitFactor != null) {
			profitFactor += entry.profitFactor * weight;
		}
	}

	return {
		support: 0,
		totalPnl: 0,
		winRate:
			weightSum > 0
				? winRate / weightSum
				: 0,
		averageRisk:
			weightSum > 0
				? averageRisk / weightSum
				: 0,
		muIn:
			weightSum > 0
				? muIn / weightSum
				: 0,
		profitFactor:
			weightSum > 0
				? profitFactor / weightSum
				: null,
		exclude: [],
		include: [],
		tradeIds: [],
	};
};

const comparisonService = (db: PrismaClient) => {
	const { getTradeScoringData } = tradeRepository(db);
	const { getLabelsWithTradeIds, getClosureLists, findLabels } = labelRepository(db);

	const getCombinations = async (labelIds: number[]) => {
		if (labelIds.length < 2) throw new ValidationError(">=2 labels needed");

		const [trades, labels, { ancestorsList, descendantsList }] =
			await Promise.all([
				getTradeScoringData(),
				getLabelsWithTradeIds(),
				getClosureLists(),
				findLabels(labelIds),
			]);

		if (labelIds.length > new Set(labelIds).size) {
			throw new ValidationError("Duplicate label ids provided");
		}

		const minSupport = 5 // 0.025 * trades.length;
		const labelIdsBitsets = generateBitsets(labels, trades, ancestorsList);

		const generalizedIds = labelIds
			.sort((a, b) => a - b)
			.map((_, i, ids) => ids.filter((_, j) => j !== i));

		const { originalBitset, createBitsetForIds } = useBitsets(
			labelIds, labelIdsBitsets
		);

		const originalForbiddenIds = new Set(labelIds.flatMap(
			id => [...ancestorsList[id] ?? [], ...descendantsList[id] ?? []]
		))
		
		const forbiddenIds = generalizedIds.map(
			ids => new Set(ids.flatMap(
				id => [
					...ancestorsList[id] ?? [],
					...descendantsList[id] ?? []
				]
			))
		);

		type Entries = [number[], number[], Bitset][];

		const generalizedEntries = generalizedIds
			.map<Entries[number]>((ids, i) => [[], ids, createBitsetForIds(i)])
			.filter(([_exc, _inc, set]) => set.popcount() > 0);

		const exculsionEntries = generalizedEntries
			.map<Entries[number]>(([_, includeIds, generilizedSet], i) => {
				const labelSet = labelIdsBitsets.get(labelIds[i])!.copy();
				andNot(generilizedSet, labelSet, labelSet);
				return [[labelIds[i]], includeIds, labelSet];
			});

		const allLabelIds = labels
			.map(l => l.id)
			.filter(id => !labelIds.includes(id));

		const insertionEntries = allLabelIds
			.filter(id => !originalForbiddenIds.has(id))
			.map<Entries[number]>(id => {
				const final = originalBitset.copy();
				const labelSet = labelIdsBitsets.get(id)!;
				and(final, labelSet, final);

				const ids = labelIds.concat(id);
				return [[], ids, final];
			});

		const replacementEntries = generalizedEntries
			.flatMap(([_exc, _inc, generalizedSet], i) => allLabelIds
				.filter(id => !forbiddenIds[i].has(id))
				.map<Entries[number]>(id => {
					const final = generalizedSet.copy();
					const labelSet = labelIdsBitsets.get(id)!;
					and(final, labelSet, final);

					const ids = generalizedIds[i].concat(id);
					return [[], ids, final];
				})
			);

		const pnls = trades.map(({ pnl }) => pnl);
		const risks = trades.map(({ risk }) => risk);

		const generateCombos = (
			entries: Entries
		): ComparisonEntry[] => entries.map(([exclude, include, set]) => ({
				...scoreBitset(set, pnls, risks),
				tradeIds: set.getSetIndices().map(i => trades[i].id),
				include,
				exclude,
			}));

		const filter = (entries: Entries) =>
			entries.filter(([_a, _b, set]) => set.popcount() >= minSupport);

		const [original]  = generateCombos([[[], labelIds, originalBitset]]);
		const generalized = generateCombos(generalizedEntries);
		const exclusion   = generateCombos(filter(exculsionEntries));
		const replacement = generateCombos(filter(replacementEntries));
		const insertion   = generateCombos(filter(insertionEntries));

		const tradeIds = [
			original,
			...generalized,
			...exclusion,
			...replacement,
			...insertion,
		].flatMap(c => c.tradeIds);

		const tradesMap = new Map(trades.map(t => [t.id, t]));
		const tradesObj = Object.fromEntries(
			[...new Set(tradeIds)].map(id => [id, tradesMap.get(id)!])
		);

		return {
			original,
			estimate: generateEstimate(generalized),
			generalized,
			exclusion,
			replacement,
			insertion,
			tradesObj,
		} as ComparisonReport;
	};

	return getCombinations;
};

export default comparisonService;