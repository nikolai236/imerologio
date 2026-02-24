import { useEffect, useMemo, useState } from "react";
import type { DbLabelEntry, ApiScoringResponse, ScoreSet } from "../../../shared/trades.types";
import useLabels from "./useLabels";
import useFetchLabels from "./useFetchLabels";

type SortBy = "upliftPnl" | "upliftPerSupport" | "muIn" | "score" | "RR";
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

	const { getScoring } = useLabels();
	const { labels } = useFetchLabels(true);

	useEffect(() => {
		getScoring()
			.then(setData)
			.catch(console.error);
	}, []);

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
			.map(level => level.map(s => ({
				...s,
				key: getKey(s.labelIds),
				k: s.labelIds.length,
				upliftPerSupport: s.support ? s.upliftPnl / s.support : 0,
			})))
			.flat();
	}, [data, getKey]);

	const fallbackRR = useMemo(() => 
		Math.max(
			...rows
				.map(e => e.RR)
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
			RR: r.RR,
			sortRR: r.RR == null ? fallbackRR : r.RR,
			upliftPerSupport: r.upliftPerSupport,
			support: r.support,
			score: r.score,
		}));
	}, [filtered, chartCount, sortBy, getName, fallbackRR]);

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
		fallbackRR,

		getName,
		setSortBy,
		setSortDir,
		setQuery,
		setChartCount,
		setMinK,
		setMaxK,
	};
};

export default useScoring;