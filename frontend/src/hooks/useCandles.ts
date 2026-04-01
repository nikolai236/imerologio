import { useEffect, useState } from "react";

import type { DbSymbol } from "../../../shared/trades.types";
import { getCandlesForRange } from "../api/candles";
import type { Candle } from "../../../shared/candles.types";
import type { TempJournalChart } from "./useJournalCharts";

const useCandles = (
	chart: TempJournalChart,
	symbol: DbSymbol | null,
	isSupported: boolean,
	setLoading: (loading: boolean) => void,
	setError: (err: string | null) => void,
) => {
	const [candles, setCandles] = useState<Candle[]>([]);

	useEffect(() => {
		if (!isSupported || symbol == null) return;

		setLoading(true);
		setError(null);

		getCandlesForRange(
			symbol.name,
			chart.timeframe,
			Number(chart.start),
			Number(chart.end)
		)
			.then(setCandles)
			.catch((e) => {
				setError(e?.message ?? "Failed to load candles");
				setCandles([]);
			})
			.finally(() => setLoading(false));

	}, [chart, symbol, isSupported]);

	return {
		candles,
		setCandles,
	}
};

export default useCandles;