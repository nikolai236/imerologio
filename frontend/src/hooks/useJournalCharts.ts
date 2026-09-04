import { useState } from "react";
import { Timeframes, type Timeframe } from "../../../shared/candles.types";
import type { DbJournalChart, JournalChart, UpdateJournalChart } from "../../../shared/journal.types";

export type TempJournalChart =
	Omit<(
		DbJournalChart<Date, Timeframe> |
		JournalChart<Timeframe>
	), "symbolId"> & {
		tempId: string;
		symbolId: number | null;
		id?: number;
	};

const uid = () =>
	Math.random().toString(16).slice(2) + Date.now().toString(16);

export const isTimeframeValid = (tf: string) =>
	Object.values(Timeframes).includes(tf as Timeframe);

const useJournalCharts = () => {
	const [charts, setCharts] = useState<TempJournalChart[]>([]);

	const DEFAULTS = {
		start: 1765141931000,
		end: 1765151982716,
		timeframe: Timeframes.tf1m,
		sybmolId: null,
	};

	const generateDefaultChart = (
		charts: TempJournalChart[],
	): TempJournalChart => {
		if (charts.length == 0) return {
			...DEFAULTS,
			tempId: uid(),
			symbolId: null,
			objects: [],
			ord: charts.length + 1,
			createdAt: new Date(Date.now()),
		};

		const { id, ...payload } = charts.at(-1)!;
		return {
			...payload,
			ord: charts.length + 1,
			tempId: uid(),
			createdAt: new Date(Date.now()),
		};
	};

	const updateChart = (id: string, payload: UpdateJournalChart<Timeframe>) => {
		const { ord, ...rest } = payload;
	
		if (ord != null) {
			setCharts(charts => {
				const from = charts.findIndex(c => id == c.tempId);
				if (from == -1) return charts;

				const [chart] = charts.splice(from, 1);
				const to = Math.max(0, Math.min(ord! - 1, charts.length));
				charts.splice(to, 0, chart);

				return charts.map(({ ord, ...c }, i) => ({
					...c,
					ord: i + 1,
				}));
			});
		}

		setCharts(charts =>
			charts.map(c => id == c.tempId ? { ...c, ...rest } : c)
		);
	};

	const addChart = () => setCharts(charts => [
		...charts,
		generateDefaultChart(charts)
	]);

	const removeChart = (id: string) => setCharts(charts =>
		charts
			.filter(c => c.tempId != id)
			.map(({ ord, ...c }, i) => ({
				...c, ord: i + 1,
			}))
	);

	type ApiChart =
		DbJournalChart<Date, Timeframe> |
		DbJournalChart<string, Timeframe>;

	const overwriteCharts = (charts: ApiChart[]) => setCharts(
		charts
			.map(({
				timeframe,
				id,
				objects,
				start,
				end,
				symbolId,
				ord,
				createdAt,
			}) => ({
				id,
				timeframe,
				symbolId,
				tempId: uid(),
				objects,
				start,
				end,
				ord,
				createdAt,
			}))
			.sort((a, b) => a.ord - b.ord)
	);

	return {
		charts,
		addChart,
		removeChart,
		updateChart,
		setCharts: overwriteCharts,
	} as const;
};

export default useJournalCharts;