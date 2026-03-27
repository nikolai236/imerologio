import { useEffect, useMemo, useState } from "react";
import type { DbLabelEntry, ApiScoringResponse, ScoreSet } from "../../../shared/trades.types";

import useFetchLabels from "./useFetchLabels";
import { usePriceDraft } from "./useDraft";

import { getScoring } from "../api/labels";

type SortBy = "upliftPnl" | "upliftPerSupport" | "muIn" | "score" | "profitFactor";
type SortDir = "desc" | "asc";

type Row = ScoreSet & {
	key: string;
	k: number;
	upliftPerSupport: number;
};

const clamp = (x: number, lo: number, hi: number) =>
	Math.max(lo, Math.min(hi, x));

const useScoring = () => {
	const [query, setQuery] = useState("");
	const [minK, setMinK] = useState<number>(1);
	const [maxK, setMaxK] = useState<number>(99);

	const [sortBy, setSortBy] = useState<SortBy>("upliftPerSupport");
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

	const idsLabels = useMemo(() => labels.reduce((prev, l) => {
		prev.set(l.id, l)
		return prev;
	}, new Map<number, DbLabelEntry>()), [labels]);

	const getName = useMemo(
		() => (id: number) => idsLabels.get(id)!.name,
		[idsLabels]
	);

	const getKey = useMemo(
		() => (ids: number[]) => ids.map(getName).join(","),
		[getName]
	);

	const rows: Row[] = useMemo(() => {
		if (data == null) return [];
		return data.levels
			.map(level => level
				.filter(s => s.redundancy == null || Math.abs(s.redundancy - 1) > 0.05)
				.map(s => ({
					...s,
					key: getKey(s.labelIds),
					k: s.labelIds.length,
					upliftPerSupport: s.support ?
						s.upliftPnl / s.support : 0,
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

	const filtered: Row[] = useMemo(() => {
		const dir = sortDir === "desc" ? -1 : 1;
		return rows
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
				if (sortBy != null && a[sortBy] !== b[sortBy]) {
  					if (a[sortBy] == null || b[sortBy] == null) {
						return a[sortBy] == null ? -1 : 1;
					}
					return (a[sortBy] < b[sortBy] ? -1 : 1) * dir;
				}

				if (a.support !== b.support) {
					return a.support < b.support ? 1 : -1;
				}

				const minLen = Math.min(a.labelIds.length, b.labelIds.length);
				for (let i = 0; i < minLen; i++) {
					if (a.labelIds[i] === b.labelIds[i]) continue;
					return a.labelIds[i] - b.labelIds[i];
				}

				return a.labelIds.length - b.labelIds.length;
			});
	}, [rows, queryLabels, minK, maxK, sortBy, sortDir]);

	const chartData = useMemo(() => {
		const maxLen = clamp(chartCount, 5, 200);
		const top = filtered.slice(0, maxLen);

		return top.map((r) => ({
			name: r.labelIds.map(getName).join("\n"),
			upliftPnl: r.upliftPnl,
			muIn: r.muIn,
			profitFactor: r.profitFactor,
			sortPf: r.profitFactor == null ? fallbackpF : r.profitFactor,
			upliftPerSupport: r.upliftPerSupport,
			support: r.support,
			score: r.score,
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