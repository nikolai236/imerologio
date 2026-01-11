import type { BarData, MouseEventParams, Time } from "lightweight-charts";
import { useState } from "react";

export type Ohlc = {
	open: number;
	high:number;
	low: number;
	close: number;
};

const useOhlc = () => {
	const [ohlc, setOhlc] = useState<Ohlc | null>(null);

	const changeOhlcOnMouseMove = (
		getPriceData: (p: MouseEventParams<Time>) => BarData<Time>
	) => (
		param: MouseEventParams<Time>
	) => {
		if (!param.time || param.seriesData.size == 0) {
			return setOhlc(null);
		}

		const price = getPriceData(param);
		if (!price) {
			return setOhlc(null);
		}

		setOhlc({
			open: price.open,
			high: price.high,
			low: price.low,
			close: price.close
		});
	}

	return {
		ohlc,
		destroyOhlc: () => setOhlc(null),
		changeOhlcOnMouseMove,
	}
};

export default useOhlc;