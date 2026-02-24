import { useState } from "react";
import { type Timeframe, Timeframes } from "../../../shared/candles.types";
import type { Chart, DbChart } from "../../../shared/trades.types";

export type TempChart = Chart<Timeframe> & {
	tempId: string;
};

const useTradeCharts = () => {
	const [charts, setCharts] = useState<TempChart[]>([]);

	const _uid = () =>
		Math.random().toString(16).slice(2) +
		Date.now().toString(16);

	const isTimeframeValid = (tf: string) =>
		Object.values(Timeframes).includes(tf as Timeframe);

	const generateDefaultChart = (charts: TempChart[]) => {
		if (charts.length == 0) return {
			start: 1765141931000,
			end: 1765151982716,
			timeframe: Timeframes.tf1m,
			tempId: _uid(),
		};

		// @ts-ignore
		const { id, ...payload } = charts.at(-1)!;
		return { ...payload, tempId: _uid() };
	};

	const updateChart = (id: string, payload: Partial<Chart<Timeframe>>) => {
		setCharts(cs =>
			cs.map(c => id == c.tempId ? { ...c, ...payload } : c)
		);
	};

	const addChart = () => setCharts(charts => [
		...charts, generateDefaultChart(charts)
	]);

	const removeChart = (id: string) => setCharts(charts =>
		charts.filter(c => c.tempId != id)
	);

	const overwriteCharts = (charts: DbChart<Timeframe>[]) =>
		setCharts(charts.map(c => ({ ...c, tempId: _uid(), })));

	return {
		charts,
		setCharts: overwriteCharts,
		isTimeframeValid,
		addChart,
		removeChart,
		updateChart,
	};
};

export default useTradeCharts;