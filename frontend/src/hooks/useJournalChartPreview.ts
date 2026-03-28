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
import { useEffect, useRef, type Dispatch, } from "react";

import type { Candle, Timeframe } from "../../../shared/candles.types";
import type { TempJournalTrade, Direction } from "./useJournalTrades";
import type { TempJournalChart } from "./useJournalCharts";

import useOhlcLabel from "./useOhlcLabel";
import useCopyMenu from "./useCopyMenu";
import TradePosition from "../chart-plugins/trade-position";
import useTimeframe from "./useTimeframe";
import useDrawJournalTrades from "./useDrawJournalTrades";

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

type NormalizeEntries = ReturnType<
	typeof useTimeframe
>["normalizeEntry"];

const displayTrade = (
	trade: TempJournalTrade,
	tf: Timeframe,
	normalizeEntry: NormalizeEntries
) => {
	const { orders, stop, target, tempId } = trade;

	const [entry, ...rest] = [...orders]
		.sort((a, b) => Number(a.date) - Number(b.date))
		.map(order => ({
			tempId: order.tempId,
			type: order.type,
			price: Number(order.price),
			time: Math.floor(new Date(order.date).getTime() / 1000) as UTCTimestamp,
			quantity: Number(order.quantity),
		}))
		.map(order => normalizeEntry(order, tf));

	const exits = rest
		.filter(e => e.type !== entry.type)
		.map(({ quantity, ...o }) => ({ ...o, quantity: -quantity }));

	return new TradePosition([entry], exits, stop, entry.type, target, tempId);
};

const useJournalChartPreview = (
	chart: TempJournalChart,
	candles: Candle[],
	trades: TempJournalTrade[],
	tf: Timeframe,
	drawingTrade: Direction | null,
	setDrawingTrade: Dispatch<Direction | null>,
) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const chartRef = useRef<IChartApi | null>(null);
	const seriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);

	const { ohlcLabel, ohlcMouseMoveHandler } = useOhlcLabel(seriesRef);
	const { copyMenuContext, copyClickHandler, closeCopyMenu } = useCopyMenu(seriesRef);

	const {
		drawingTradeRef,
		dragStateRef,
		onClickTradeHandler,
		setupTradesResizeEventListeners,
		clearTradesResizeEventListeners,
	} = useDrawJournalTrades(
		seriesRef,
		chartRef,
		containerRef,
		chart,
		trades,
		drawingTrade,
		setDrawingTrade,
		tf
	);

	const clickHandler = (params: MouseEventParams<Time>) => {
		if (dragStateRef.current != null) return;

		const direction = drawingTradeRef.current;

		if (direction == null) {
			copyClickHandler(params);
			return;
		}

		onClickTradeHandler(params);
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

		chart.subscribeCrosshairMove(ohlcMouseMoveHandler);
		chart.subscribeClick(clickHandler);

		const preventContext = (e: Event) => e.preventDefault();
		containerRef.current.addEventListener("contextmenu", preventContext);

		chartRef.current = chart;

		window.addEventListener("resize", handleChartResize);
		setupTradesResizeEventListeners();

		return () => {
			window.removeEventListener("resize", handleChartResize);
			clearTradesResizeEventListeners();

			chartRef.current?.unsubscribeClick(clickHandler);

			chartRef.current?.unsubscribeCrosshairMove(ohlcMouseMoveHandler);
			containerRef.current?.removeEventListener("contextmenu",preventContext);

			chart.remove();

			chartRef.current = null;
			seriesRef.current = null;
		};
	}, [candles, tf]);

	return {
		containerRef,
		ohlcLabel,
		copyMenuContext,
		closeCopyMenu,
	} as const;
};

export default useJournalChartPreview;