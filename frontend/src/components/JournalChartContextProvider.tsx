import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import JournalChartContext from "../context/JournalChartContext";
import type { IChartApi } from "lightweight-charts";

import type { TempJournalChart } from "../hooks/useJournalCharts";
import useJournalContext from "../hooks/useJournalContext";
import type { DbSymbol } from "../../../shared/trades.types";
import type { Direction } from "../hooks/useJournalTrades";

import useSymbolId from "../hooks/useSymbolId";
import useCandles from "../hooks/useCandles";

type Props = {
	chart: TempJournalChart;
	symbols: DbSymbol[];
	children: ReactNode;
};

export default function JournalChartContextProvider({
	symbols,
	chart,
	children,
}: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const chartRef = useRef<IChartApi | null>(null);

	type Series = ReturnType<IChartApi["addSeries"]> | null;
	const seriesRef = useRef<Series>(null);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [drawingTrade, setDrawingTrade] = useState<Direction | null>(null);
	const [openTradeId, setOpenTradeId] = useState<string | null>(null);

	const {
		symbolId,
		setSymbolId,
		isSupported
	} = useSymbolId();

	const symbol = useMemo(
		() => symbols.find(s => s.id == Number(symbolId)) ?? null,
		[symbols, symbolId],
	);

	const { candles, setCandles } = useCandles(
		chart,
		symbol,
		isSupported,
		setLoading,
		setError
	);

	const { trades, updateChart } = useJournalContext();

	useEffect(() => {
		if (symbolId === "") {
			setSymbolId(String(chart.symbolId ?? ""));
			return;
		}

		const { tempId } = chart;
		updateChart(tempId, { symbolId: Number(symbolId) });
	}, [symbolId]);

	const openTrade = useMemo(
		() =>
			openTradeId
				? trades.find(t => t.tempId === openTradeId) ?? null
				: null,
		[openTradeId, trades]
	);

	const relevantTrades = useMemo(
		() => trades
			.filter(t => t.symbolId === Number(symbolId))
			.sort((a, b) => {
				const aTime = a.orders[0].date.getTime();
				const bTime = b.orders[0].date.getTime();
				return bTime - aTime;
			}),
		[symbolId, trades]
	);

	const value = {
		chart,
		trades: relevantTrades,
		symbols,
		symbol,

		candles,
		setCandles,

		openTrade,
		openTradeId,
		setOpenTradeId,

		drawingTrade,
		setDrawingTrade,

		seriesRef,
		chartRef,
		containerRef,

		loading,
		setLoading,

		error,
		setError,

		isSupported,
		setSymbolId,
	} as const;

	return (
		<JournalChartContext.Provider value={value}>
			{children}
		</JournalChartContext.Provider>
	);
}