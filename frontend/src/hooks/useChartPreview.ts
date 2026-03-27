import {
	CandlestickSeries,
	ColorType,
	createChart,
	CrosshairMode,
	type IChartApi,
	type MouseEventParams,
	type Time,
	type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, type Dispatch } from "react";

import type { Candle, Timeframe } from "../../../shared/candles.types";
import type { ChartLine } from "../../../shared/trades.types";

import TradePosition from "../chart-plugins/trade-position";

import useTradeContext from "./useTradeContext";
import useOhlcLabel from "./useOhlcLabel";
import useCopyMenu from "./useCopyMenu";
import useDrawLinesTool from "./useDrawLinesTool";

const SECOND = 1000;

const timeFormatter = (unixEpoch: number) => {
	return new Date(unixEpoch * SECOND).toLocaleString("en-US", {
		timeZone: "America/New_York",
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "2-digit",
		hour: "numeric",
		minute: "2-digit",
	});
};

const transformCandle = (candle: Candle) => ({
	time: (Math.floor(candle.time) / 1000) as UTCTimestamp,
	open: candle.open,
	high: candle.high,
	low: candle.low,
	close: candle.close,
});

const getCandleOptions = () => ({
	upColor: "#ffffff",
	downColor: "#000000",
	borderUpColor: "#000000",
	borderDownColor: "#000000",
	wickUpColor: "#000000",
	wickDownColor: "#000000",
});

const useChartPreview = (
	candles: Candle[],
	tf: Timeframe,
	drawingMode: boolean,
	lines: ChartLine[],
	setDrawingMode: Dispatch<React.SetStateAction<boolean>>,
	commitLines: (lines: ChartLine[]) => void,
) => {
	const { getEntryForTf, getExitsForTf, stop, target } = useTradeContext();

	const containerRef = useRef<HTMLDivElement | null>(null);
	const chartRef = useRef<IChartApi | null>(null);

	const seriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);

	const { ohlcLabel, ohlcMouseMoveHandler } = useOhlcLabel(seriesRef);
	const { copyMenuContext, copyClickHandler, closeCopyMenu } = useCopyMenu(seriesRef);

	const {
		selectedLine,
		lineSelectionHandler,
		deleteSelectedLine,
		attachPrimitives,
		lineClickHandler,
		lineMouseMoveHandler,
	} = useDrawLinesTool(
		seriesRef,
		lines,
		setDrawingMode,
		closeCopyMenu,
		commitLines
	);

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key !== "Backspace") return;

		const target = e.target as HTMLElement | null;
		const tag = target?.tagName;
		const editable =
			tag === "INPUT" ||
			tag === "TEXTAREA" ||
			target?.isContentEditable;

		if (editable || !selectedLine.current) return;

		deleteSelectedLine();
	};

	// combine click handlers
	const clickHandler = (params: MouseEventParams<Time>) => {
		if (params.point != null) {
			const { point: { x, y } } = params;

			const halt = lineSelectionHandler(x, y);
			if (halt) return;
		}

		copyClickHandler(params);
	};

	const handleChartResize = () => {
		if (!containerRef.current || !chartRef.current) return;
		chartRef.current.applyOptions({
			width: containerRef.current.clientWidth || undefined,
		});
	};

	const getConfig = () => ({
		height: 500,
		width: containerRef.current?.clientWidth || undefined,
		layout: {
			textColor: "#ffffffff",
			background: {
				type: ColorType.Solid,
				color: "transparent",
			},
		},
		rightPriceScale: { borderVisible: false },
		timeScale: { borderVisible: false },
		localization: { timeFormatter },
		crosshair: { mode: CrosshairMode.Normal },
	});

	useEffect(() => {
		if (containerRef.current == null || candles.length === 0) {
			return;
		}

		if (chartRef.current != null) {
			chartRef.current.remove();
			chartRef.current = null;
			seriesRef.current = null;
		}

		const chart = createChart(containerRef.current, getConfig());
		const series = chart.addSeries(CandlestickSeries, getCandleOptions());

		seriesRef.current = series;

		series.setData(candles.map(transformCandle));
		series.applyOptions({
			priceFormat: {
				type: "price",
				precision: 6,
				minMove: 0.000001,
			},
		});

		attachPrimitives();

		chart.subscribeCrosshairMove(ohlcMouseMoveHandler);

		if (drawingMode) {
			chart.subscribeClick(lineClickHandler);
			chart.subscribeCrosshairMove(lineMouseMoveHandler);
		} else {
			chart.subscribeClick(clickHandler);
		}

		const preventContext = (e: Event) => e.preventDefault();
		containerRef.current.addEventListener("contextmenu", preventContext);

		try {
			const entry = getEntryForTf(tf);
			if (entry == null) throw new Error("Entry is not defined");

			const direction = Number(stop) > entry.price ? "SELL" : "BUY";

			const trade = new TradePosition(
				[entry],
				getExitsForTf(tf),
				Number(stop),
				direction,
				Number(target)
			);

			series.attachPrimitive(trade);
		} catch (err) {
			console.error(err);
		}

		chartRef.current = chart;

		window.addEventListener("resize", handleChartResize);
		window.addEventListener("keydown", onKeyDown);

		return () => {
			window.removeEventListener("resize", handleChartResize);
			window.removeEventListener("keydown", onKeyDown);

			// unsubscribe the correct click handler
			if (drawingMode) {
				chartRef.current?.unsubscribeCrosshairMove(lineMouseMoveHandler);
				chartRef.current?.unsubscribeClick(lineClickHandler);
			} else {
				chartRef.current?.unsubscribeClick(clickHandler);
			}

			chartRef.current?.unsubscribeCrosshairMove(ohlcMouseMoveHandler);
			containerRef.current?.removeEventListener("contextmenu",preventContext);

			chart.remove();

			chartRef.current = null;
			seriesRef.current = null;
		};
	}, [candles, tf, drawingMode]);

	return {
		containerRef,
		ohlcLabel,
		copyMenuContext,
		closeCopyMenu,
		deleteSelectedLine,
	} as const;
};

export default useChartPreview;