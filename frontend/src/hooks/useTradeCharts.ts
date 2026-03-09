import { useCallback, useState } from "react";
import { type Timeframe, Timeframes } from "../../../shared/candles.types";
import type { Chart, DbChart } from "../../../shared/trades.types";
import type { TempOrder } from "./useTradeOrders";

export type TempChart = Chart<Timeframe> & {
	tempId: string;
};

const uid = () =>
	Math.random().toString(16).slice(2) + Date.now().toString(16);

export const isTimeframeValid = (tf: string) =>
	Object.values(Timeframes).includes(tf as Timeframe);

const useTradeCharts = (orders: TempOrder[]) => {
	const [charts, setCharts] = useState<TempChart[]>([]);

	const DEFAULTS = {
		start: 1765141931000,
		end: 1765151982716,
		timeframe: Timeframes.tf1m,
	};

	const generateDefaultChart = (
		charts: TempChart[],
		orders: TempOrder[]
	) => {
		if (charts.length > 0) {
			// @ts-ignore
			const { id, lines, ...payload } = charts.at(-1)!;
			return { ...payload, lines: [], tempId: uid() };
		}

		const ret = { ...DEFAULTS, tempId: uid(), lines: [] };
		if (orders.length == 0) return ret;

		ret.start = Math.min(...orders.map(o => o.date));
		ret.end   = Math.max(...orders.map(o => o.date));

		return ret;
	};

	const updateChart = (id: string, payload: Partial<Chart<Timeframe>>) => setCharts(charts =>
		charts.map(c => id == c.tempId ? { ...c, ...payload } : c)
	);

	const addChart = useCallback(() => setCharts(charts => [
		...charts, generateDefaultChart(charts, orders)
	]), [orders]);

	const removeChart = (id: string) => setCharts(charts =>
		charts.filter(c => c.tempId != id)
	);

	const overwriteCharts = (charts: DbChart<Timeframe>[]) =>
		setCharts(charts.map(chart => ({ ...chart, tempId: uid(), })));

	return {
		charts,
		setCharts: overwriteCharts,
		addChart,
		removeChart,
		updateChart,
	};
};

export default useTradeCharts;