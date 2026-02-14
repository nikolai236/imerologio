import type { BarData, MouseEventParams, Time } from "lightweight-charts";
import { useState } from "react";

export type Ohlc = {
	open: number;
	high:number;
	low: number;
	close: number;
};

const useOhlcLabel = () => {
	const [ohlc, setOhlc] = useState<Ohlc | null>(null);

	const changeOhlcOnMouseMove = (getPriceData: (p: MouseEventParams<Time>) => BarData<Time>) =>
		(param: MouseEventParams<Time>) => setOhlc(() => {
			if (!param.time || param.seriesData.size == 0) {
				return null;
			}
			const price = getPriceData(param);
			if (!price) return null;

			return {
				open: price.open,
				high: price.high,
				low: price.low,
				close: price.close
			};
		});

	return {
		ohlc,
		destroyOhlc: () => setOhlc(null),
		changeOhlcOnMouseMove,
	}
};

export default useOhlcLabel;