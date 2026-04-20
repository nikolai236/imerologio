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
			createdAt: new Date(Date.now()),
		};

		const { id, ...payload } = charts.at(-1)!;
		return {
			...payload,
			tempId: uid(),
			createdAt: new Date(Date.now()),
		};
	};

	const updateChart = (id: string, payload: UpdateJournalChart<Timeframe>) => setCharts(charts =>
		charts.map(c => id == c.tempId ? { ...c, ...payload } : c)
	);

	const addChart = () => setCharts(charts => [
		...charts,
		generateDefaultChart(charts)
	]);

	const removeChart = (id: string) => setCharts(charts =>
		charts.filter(c => c.tempId != id)
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
				createdAt,
			}) => ({
				id,
				timeframe,
				symbolId,
				tempId: uid(),
				objects,
				start,
				end,
				createdAt,
			}))
			.sort((a, b) =>
				new Date(a.createdAt).getTime() -
				new Date(b.createdAt).getTime()
			)
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