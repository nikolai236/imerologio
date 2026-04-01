import type { IChartApi } from "lightweight-charts";
import { createContext, type Dispatch, type RefObject, type SetStateAction } from "react";

import type { TempJournalChart } from "../hooks/useJournalCharts";
import type { Direction, TempJournalTrade } from "../hooks/useJournalTrades";
import type { Candle } from "../../../shared/candles.types";
import type { DbSymbol } from "../../../shared/trades.types";

type ContextType = {
	chart: TempJournalChart,
	symbols: DbSymbol[];
	symbol: DbSymbol | null;

	candles: Candle[]
	setCandles: Dispatch<Candle[]>;

	seriesRef: RefObject<
		ReturnType<IChartApi["addSeries"]> | null
	>,
	chartRef: RefObject<IChartApi | null>,
	containerRef: RefObject<HTMLDivElement | null>,

	drawingTrade: Direction | null,
	setDrawingTrade: Dispatch<SetStateAction<Direction | null>>,

	openTrade: TempJournalTrade | null,
	openTradeId: string | null;
	setOpenTradeId: Dispatch<string | null>,

	error: string | null;
	setError: Dispatch<string | null>;

	loading: boolean;
	setLoading: Dispatch<boolean>;

	isSupported: boolean;
	setSymbolId: Dispatch<string>;

	trades: TempJournalTrade[];
};

const JournalChartContext = createContext<ContextType | null>(null);
export default JournalChartContext;