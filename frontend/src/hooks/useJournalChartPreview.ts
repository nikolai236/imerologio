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
import { useEffect, useRef, } from "react";

import type { Candle, Timeframe } from "../../../shared/candles.types";

import useOhlcLabel from "./useOhlcLabel";
import useCopyMenu from "./useCopyMenu";
import type { TempJournalTrade, Direction, AddTrade } from "./useJournalTrades";
import TradePosition from "../chart-plugins/trade-position";
import useTimeframe from "./useTimeframe";
import type { TempJournalChart } from "./useJournalCharts";

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
	const { orders, stop, target } = trade;

	const [entry, ...rest] = [...orders]
		.sort((a, b) => Number(a.date) - Number(b.date))
		.map(order => ({
			type: order.type,
			price: Number(order.price),
			time: Math.floor(new Date(order.date).getTime() / 1000) as UTCTimestamp,
			quantity: Number(order.quantity),
		}))
		.map(order => normalizeEntry(order, tf));

	const exits = rest
		.filter(e => e.type !== entry.type)
		.map(({ quantity, ...o }) => ({ ...o, quantity: -quantity }));

	return new TradePosition([entry], exits, stop, entry.type, target);
};

const useJournalChartPreview = (
	chart: TempJournalChart,
	candles: Candle[],
	trades: TempJournalTrade[],
	tf: Timeframe,
	drawingTrade: Direction | null,
	addTrade: AddTrade,
) => {
	const { normalizeEntry } = useTimeframe();

	const containerRef = useRef<HTMLDivElement | null>(null);
	const chartRef = useRef<IChartApi | null>(null);

	const tradePrimitivesRef = useRef<TradePosition[]>([]);
	const tradeDrawingRef = useRef<Direction | null>(null);

	const seriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);

	const { ohlcLabel, ohlcMouseMoveHandler } = useOhlcLabel(seriesRef);
	const { copyMenuContext, copyClickHandler, closeCopyMenu } = useCopyMenu(seriesRef);

	const clickHandler = (params: MouseEventParams<Time>) => {
		const direction = tradeDrawingRef.current;

		if (direction == null) {
			copyClickHandler(params);
			return;
		}

		if (!seriesRef.current || !chartRef.current || !containerRef.current) {
			return;
		}

		if (params.point == null || params.time == null) {
			return;
		}

		const entryPrice = seriesRef.current.coordinateToPrice(params.point.y);
		if (entryPrice == null) return;

		const chartHeight = containerRef.current.clientHeight;
		const bufferPx = chartHeight / 4;

		const targetY =
			direction === "Long"
				? params.point.y - bufferPx
				: params.point.y + bufferPx;

		const targetPrice = seriesRef.current.coordinateToPrice(targetY);
		if (targetPrice == null) return;

		const bufferPrice = Math.abs(targetPrice - entryPrice);
		if (!Number.isFinite(bufferPrice) || bufferPrice <= 0) return;

		const startS = Number(params.time);

		const visibleRange = chartRef.current.timeScale().getVisibleRange();
		const fromS = visibleRange?.from != null ? Number(visibleRange.from) : startS;
		const toS = visibleRange?.to != null ? Number(visibleRange.to) : startS + 60;

		const visibleSpanS = Math.max(1, toS - fromS);
		const endS = Math.max(startS + 1, Math.floor(startS + visibleSpanS / 4));

		addTrade(
			chart,
			startS,
			endS,
			entryPrice,
			bufferPrice,
			direction,
		);
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
		tradeDrawingRef.current = drawingTrade;
	}, [drawingTrade]);

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

		return () => {
			window.removeEventListener("resize", handleChartResize);

			chartRef.current?.unsubscribeClick(clickHandler);

			chartRef.current?.unsubscribeCrosshairMove(ohlcMouseMoveHandler);
			containerRef.current?.removeEventListener("contextmenu",preventContext);

			chart.remove();

			chartRef.current = null;
			seriesRef.current = null;
		};
	}, [candles, tf]);

	useEffect(() => {
		if (!seriesRef.current || !chartRef.current) return;

		tradePrimitivesRef.current = [];

		for (const trade of trades) {
			const pos = displayTrade(trade, tf, normalizeEntry);
			seriesRef.current.attachPrimitive(pos);
			tradePrimitivesRef.current.push(pos);
		}
	}, [trades, tf]);

	return {
		containerRef,
		ohlcLabel,
		copyMenuContext,
		closeCopyMenu,
	} as const;
};

export default useJournalChartPreview;