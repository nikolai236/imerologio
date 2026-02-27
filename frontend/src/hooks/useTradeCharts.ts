import { useCallback, useState } from "react";
import { type Timeframe, Timeframes } from "../../../shared/candles.types";
import type { Chart, DbChart } from "../../../shared/trades.types";
import type { UTCTimestamp } from "lightweight-charts";

export type TempChart = Chart<Timeframe> & {
	tempId: string;
};

type OrderArgument = {
	price: number;
    time: UTCTimestamp;
    quantity: number;
}

const _uid = () =>
	Math.random().toString(16).slice(2) + Date.now().toString(16);

const isTimeframeValid = (tf: string) =>
	Object.values(Timeframes).includes(tf as Timeframe);

const useTradeCharts = (entry: OrderArgument | null, exits: OrderArgument[]) => {
	const [charts, setCharts] = useState<TempChart[]>([]);

	const DEFAULTS = {
		start: 1765141931000,
		end: 1765151982716,
		timeframe: Timeframes.tf1m,
	};

	const generateDefaultChart = (charts: TempChart[], entry: OrderArgument | null, exits: OrderArgument[]) => {
		if (charts.length == 0) {
			const ret = {
				...DEFAULTS,
				timeframe: Timeframes.tf1m,
				tempId: _uid(),
			};

			if (exits.length == 0 && entry == null) {
				return ret;
			}

			if (entry != null) {
				ret.start = entry.time * 1000;
				ret.end  = entry.time * 1000;
			}

			if (exits.length != 0) {
				const last = exits.at(-1)!;

				if(entry == null) ret.start = last.time * 1000;
				ret.end = last.time * 1000;
			}

			return ret;
		}

		// @ts-ignore
		const { id, ...payload } = charts.at(-1)!;
		return { ...payload, tempId: _uid() };
	};

	const updateChart = (id: string, payload: Partial<Chart<Timeframe>>) => setCharts(charts =>
		charts.map(c => id == c.tempId ? { ...c, ...payload } : c)
	);

	const addChart = () => useCallback(() => setCharts(charts => [
		...charts, generateDefaultChart(charts, entry, exits)
	]), [entry, exits]);

	const removeChart = (id: string) => setCharts(charts =>
		charts.filter(c => c.tempId != id)
	);

	const overwriteCharts = (charts: DbChart<Timeframe>[]) =>
		setCharts(charts.map(chart => ({ ...chart, tempId: _uid(), })));

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