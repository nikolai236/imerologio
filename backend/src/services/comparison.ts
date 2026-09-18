import { PrismaClient } from "@prisma/client";
import tradeRepository from "../database/trades";
import labelRepository from "../database/labels";
import { generateBitsets, scoreBitset } from "./scoring";
import Bitset, { and, andNot, or, popcount } from "../../lib/bitset";
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

const comparisonService = (db: PrismaClient) => {
	const { getTradeScoringData } = tradeRepository(db);
	const { getLabelsWithTradeIds, getClosureLists, findLabels } = labelRepository(db);

	const getCombinations = async (labelIds: number[]) => {
		if (labelIds.length < 2) throw new ValidationError(">=2 labels needed");

		const [trades, labels, { ancestorsList, descendantsList }] = await Promise.all([
			getTradeScoringData(),
			getLabelsWithTradeIds(),
			getClosureLists(),
			findLabels(labelIds),
		]);

		if (labelIds.length > new Set(labelIds).size) {
			throw new ValidationError("Duplicate label ids provided");
		}

		const labelIdsBitsets = generateBitsets(
			labels, trades, ancestorsList
		);

		const minSupport = 0.05 * trades.length;

		const generalizedIds = labelIds
			.sort((a, b) => a - b)
			.map((_, i, ids) => ids.filter((_, j) => j !== i));

		const { originalBitset, createBitsetForIds } = useBitsets(
			labelIds, labelIdsBitsets
		);

		const originalForbiddenIds = new Set(labelIds.flatMap(
			id => [...ancestorsList[id] ?? [], ...descendantsList[id] ?? []]
		))
		
		const forbiddenIds = generalizedIds
			.map(ids => new Set(ids.flatMap(
				id => [...ancestorsList[id] ?? [], ...descendantsList[id] ?? []]
			)));

		const generalized = generalizedIds.map(
			(ids, i) => [ids, createBitsetForIds(i)]
		) as [number[], Bitset][];

		const excluded = generalized
			.map(([includeIds, a], i) => {
				const b = labelIdsBitsets.get(labelIds[i])!.copy();
				andNot(a, b, b);
				return [labelIds[i], includeIds, b];
			}) as [number, number[], Bitset][];

		const allLabelIds = labels
			.map(l => l.id)
			.filter(id => !labelIds.includes(id));

		const inserted = allLabelIds
			.filter(id => !originalForbiddenIds.has(id))
			.map(id => {
				const ret = originalBitset.copy();
				const curr = labelIdsBitsets.get(id)!;
				and(ret, curr, ret);

				const ids = labelIds.concat(id);
				return [ids, ret];
			}) as [number[], Bitset][];

		const replace = generalized
			.flatMap(([_, a], i) => allLabelIds
				.filter(id => !forbiddenIds[i].has(id))
				.map(id => {
					const ret = a.copy();
					const curr = labelIdsBitsets.get(id)!;
					and(ret, curr, ret);

					const ids = generalizedIds[i].concat(id);
					return [ids, ret];
				})
			) as [number[], Bitset][];

		const pnls = trades.map(({ pnl }) => pnl);
		const risks = trades.map(({ risk }) => risk);

		const score = (b: Bitset) => scoreBitset(b, pnls, risks);

		// no need for support check since it has support >= original 
		const generalizedCombos: ComparisonEntry[] = generalized
			.map(([include, set]) => ({
				...score(set),
				tradeIds: set.getSetIndices().map(i => trades[i].id),
				include,
				exclude: []
			}));

		const combsWithExclusion: ComparisonEntry[] = excluded
			.filter(([_a, _b, set]) => set.popcount() >= minSupport)
			.map(([excludeId, include, set]) => ({
				...score(set),
				tradeIds: set.getSetIndices().map(i => trades[i].id),
				include,
				exclude: [excludeId]
			}));

		const combosWithInsertion: ComparisonEntry[] = inserted
			.filter(([_, set]) => set.popcount() >= minSupport)
			.map(([include, set]) => ({
				...score(set),
				tradeIds: set.getSetIndices().map(i => trades[i].id),
				include,
				exclude: [],
			}));

		const combosWithReplacement: ComparisonEntry[] = replace
			.filter(([_, set]) => set.popcount() >= minSupport)
			.map(([include, set]) => ({
				...score(set),
				tradeIds: set.getSetIndices().map(i => trades[i].id),
				include,
				exclude: [],
			}));

		return {
			original: {
				...score(originalBitset),
				tradeIds: originalBitset.getSetIndices().map(i => trades[i].id),
				include: labelIds,
				exclude: [],
			},
			generalized: generalizedCombos,
			exclusion: combsWithExclusion,
			replacement: combosWithReplacement,
			insertion: combosWithInsertion,
		} as ComparisonReport;
	};

	return getCombinations;
};

export default comparisonService;