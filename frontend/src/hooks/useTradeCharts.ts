import { useState } from "react";
import { Timeframe, type ChartStringTf } from "../../../shared/candles.types";

export type TempChart = ChartStringTf & {
	tempId: string;
};

const useTradeCharts = () => {
	const [charts, setCharts] = useState<TempChart[]>([]);

	const _uid = () =>
		Math.random().toString(16).slice(2) +
		Date.now().toString(16);

	const isTimeframeValid = (tf: string) =>
		Object.keys(Timeframe).includes(tf);

	const _defaultChart = (charts: TempChart[]) => charts.length == 0 ?
		{
			start: 1765141931000,
			end: 1765151982716,
			timeframe: Timeframe.tf1m,
			tempId: _uid(),
		} :
		{ ...charts.at(-1)!, tempId: _uid() };

	const updateChart = (id: string, payload: Partial<ChartStringTf>) => {
		setCharts(cs =>
			cs.map(c => id == c.tempId ? { ...c, ...payload } : c)
		);
	};

	const addChart = () => setCharts(
		cs => [...cs, _defaultChart(cs)]
	);

	const removeChart = (id: string) => setCharts(
		cs => cs.filter(c => c.tempId != id)
	);

	return {
		charts,
		isTimeframeValid,
		addChart,
		removeChart,
		updateChart,
	};
};

export default useTradeCharts;