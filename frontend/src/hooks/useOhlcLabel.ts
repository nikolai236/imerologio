import type { BarData, IChartApi, MouseEventParams, Time } from "lightweight-charts";
import { useState, type RefObject } from "react";

export type Ohlc = {
	open: number;
	high:number;
	low: number;
	close: number;
};

const useOhlcLabel = (
	seriesRef: RefObject<ReturnType<IChartApi["addSeries"]> | null>
) => {
	const [ohlc, setOhlc] = useState<Ohlc | null>(null);

	const changeOhlcOnMouseMove = (param: MouseEventParams<Time>) => setOhlc(() => {
		if (!param.time || param.seriesData.size == 0 || seriesRef.current == null) {
			return null;
		}

		const price = param
			.seriesData
			.get(seriesRef.current) as BarData<Time>;

		return price ? {
			open: price.open,
			high: price.high,
			low: price.low,
			close: price.close
		} : null;
	});

	return {
		ohlc,
		destroyOhlc: () => setOhlc(null),
		changeOhlcOnMouseMove,
	} as const;
};

export default useOhlcLabel;