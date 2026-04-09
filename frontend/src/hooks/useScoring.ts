import { useCallback, useEffect, useMemo, useState } from "react";
import type { DbLabelEntry, ApiScoringResponse, ScoreSet } from "../../../shared/trades.types";

import useFetchLabels from "./useFetchLabels";
import { usePriceDraft } from "./useDraft";

import { getScoring } from "../api/labels";

export type SortBy = "totalPnl" | "muIn" | "score" | "profitFactor" | "score";
type SortDir = "desc" | "asc";

type Row = ScoreSet & {
	key: string;
	k: number;
};

const clamp = (x: number, lo: number, hi: number) =>
	Math.max(lo, Math.min(hi, x));

const useScoring = () => {
	const [query, setQuery] = useState("");
	const [minK, setMinK] = useState<number>(1);
	const [maxK, setMaxK] = useState<number>(99);

	const [sortBy, setSortBy] = useState<SortBy>("muIn");
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	const [chartCount, setChartCount] = useState<number>(25);
	const [data, setData] = useState<ApiScoringResponse | null>(null);

	const [filterBe, setFilterBe] = useState(false);
	const [beThreshold, setBeThreshold] = useState(0);

	const saveBeThreshold = (pnl: number | null) =>
		setBeThreshold(pnl ?? NaN);

	const {
		draft: beThresholdDraft,
		setDraft: setBeThresholdDraft,
		saveDraft: saveBeThresholdDraft 
	} = usePriceDraft(beThreshold, saveBeThreshold);

	const { labels } = useFetchLabels(true);

	useEffect(() => {
		getScoring(filterBe, beThreshold)
			.then(setData)
			.catch(console.error);
	}, [filterBe, beThreshold]);

	const idsLabels = useMemo(
		() =>
			labels.reduce((prev, l) => {
				prev.set(l.id, l);
				return prev;
			}, new Map<number, DbLabelEntry>()),
		[labels]
	);

	const getName = useCallback(
		(id: number) => idsLabels.get(id)!.name,
		[idsLabels]
	);

	const getKey = useCallback(
		(ids: number[]) => ids.map(getName).join(","),
		[getName]
	);

	const rows: Row[] = useMemo(() => {
		if (data == null) return [];
		return data.levels
			.map(level => level
				.filter(s => s.redundancy == null || Math.abs(s.redundancy - 1) > 0.05)
				.map(s => ({
					...s,
					totalPnl: data?.total ? (100 * s.totalPnl / data?.total) : 0,
					key: getKey(s.labelIds),
					k: s.labelIds.length,
				}))
			).flat();
	}, [data, getKey]);

	const fallbackpF = useMemo(() => 
		Math.max(
			...rows
				.map(e => e.profitFactor)
				.filter(rr => rr != null)
			),
		[rows]
	);

	const maxObservedK = useMemo(
		() => Math.max(...rows.map(r => r.k)), [rows]
	);

	const queryLabels = useMemo(
		() => query
			.trim()
			.split(",")
			.map((x) => x.trim())
			.filter(Boolean),
		[query]
	);

	const filtered: Row[] = useMemo(() =>
		rows
			.filter((r) => {
				if (r.k < minK || r.k > maxK) return false;

				for (const queryName of queryLabels) {
					let has = false;
					for (const name of r.labelIds.map(getName)) {
						if (!name.includes(queryName)) continue;
						has = true;
						break;
					}
					if (has) continue;
					return false;
				}
				return true;
			})
			.sort((a, b) => {
				const av = a[sortBy];
				const bv = b[sortBy];

				if (sortBy != null && av != bv) {
					if (av == null) return sortDir === "asc" ? -1 : 1;
					if (bv == null) return sortDir === "asc" ? 1 : -1;

					return sortDir === "asc" ? av - bv : bv - av;
				}

				if (a.support !== b.support) {
					return b.support - a.support;
				}

				const minLen = Math.min(a.labelIds.length, b.labelIds.length);
				for (let i = 0; i < minLen; i++) {
					if (a.labelIds[i] === b.labelIds[i]) continue;
					return a.labelIds[i] - b.labelIds[i];
				}

				return a.labelIds.length - b.labelIds.length;
			}),
		[rows, queryLabels, minK, maxK, sortBy, sortDir, getName]
	);

	const chartData = useMemo(() => {
		const maxLen = clamp(chartCount, 5, 200);
		const top = filtered.slice(0, maxLen);

		return top.map((row) => ({
			name: row.labelIds.map(getName).join("\n"),
			totalPnl: row.totalPnl,
			muIn: row.muIn,
			profitFactor: row.profitFactor,
			sortPf: row.profitFactor == null ? fallbackpF : row.profitFactor,
			support: row.support,
			score: row.score,
		}));
	}, [filtered, chartCount, sortBy, getName, fallbackpF]);

	return {
		data,
		chartData,
		filtered,
		maxObservedK,
		query,
		minK,
		maxK,
		sortBy,
		sortDir,
		chartCount,
		fallbackpF,

		filterBreakeven: filterBe,
		beThresholdDraft,

		setFilterBreakeven: setFilterBe,
		setBeThresholdDraft,
		saveBeThresholdDraft,

		getName,
		setSortBy,
		setSortDir,
		setQuery,
		setChartCount,
		setMinK,
		setMaxK,
	} as const;
};

export default useScoring;