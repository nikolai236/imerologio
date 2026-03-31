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

import type { Candle } from "../../../shared/candles.types";
import type { TempJournalTrade, Direction } from "./useJournalTrades";
import type { TempJournalChart } from "./useJournalCharts";

import useOhlcLabel from "./useOhlcLabel";
import useCopyMenu from "./useCopyMenu";
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

const useJournalChartPreview = (
	chart: TempJournalChart,
	candles: Candle[],
	trades: TempJournalTrade[],
	drawingTrade: Direction | null,
	openTrade: TempJournalTrade | null,
	setOpenTradeId: (id: string | null) => void,
	setDrawingTrade: Dispatch<Direction | null>,
) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const chartRef = useRef<IChartApi | null>(null);
	const seriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);

	const openTradeRef = useRef<typeof openTrade>(openTrade);

	useEffect(() => {
		openTradeRef.current = openTrade
	}, [openTrade]);

	const { ohlcLabel, ohlcMouseMoveHandler } = useOhlcLabel(seriesRef);
	const { copyMenuContext, copyClickHandler, closeCopyMenu } = useCopyMenu(seriesRef);

	const {
		drawingTradeRef,
		dragStateRef,
		tradeSelectionHandler,
		onClickTradeHandler,
		attachPrimitives,
		tradePrimitivesRef,
		setupTradesResizeEventListeners,
		clearTradesResizeEventListeners,
		selectedTradeRef,
		deleteSelectedTrade,
	} = useDrawJournalTrades(
		seriesRef,
		chartRef,
		containerRef,
		chart,
		trades,
		drawingTrade,
		setDrawingTrade,
	);

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key !== "Backspace") return;

		const target = e.target as HTMLElement | null;
		const tag = target?.tagName;
		const editable =
			tag === "INPUT" ||
			tag === "TEXTAREA" ||
			target?.isContentEditable;

		if (editable || !selectedTradeRef.current) return;

		deleteSelectedTrade();
	};

	const doubleClickHandler = (params: MouseEventParams) => {
		if (openTradeRef.current != null || !params.point) return;

		const { x, y } = params.point;

		let t: string | null = null;
		const n = tradePrimitivesRef.current.length; 

		for (let i = n - 1; i >= 0; i--) {
			const trade = tradePrimitivesRef.current[i];
			if (trade.isPointInside(x, y)) {
				t = trade.getTempId();
				break;
			}
		}

		setOpenTradeId(t);
	};

	const clickHandler = (params: MouseEventParams<Time>) => {
		if (dragStateRef.current != null) return;

		if (params.point != null) {
			const { point: { x, y } } = params;

			const halt = tradeSelectionHandler(x, y);
			if (halt) return;
		}

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
		chart.subscribeDblClick(doubleClickHandler);

		const preventContext = (e: Event) => e.preventDefault();
		containerRef.current.addEventListener("contextmenu", preventContext);

		chartRef.current = chart;

		attachPrimitives();

		window.addEventListener("resize", handleChartResize);
		window.addEventListener("keydown", onKeyDown);

		setupTradesResizeEventListeners();

		return () => {
			window.removeEventListener("resize", handleChartResize);
			window.removeEventListener("keydown", onKeyDown);

			clearTradesResizeEventListeners();

			chartRef.current?.unsubscribeClick(clickHandler);

			chartRef.current?.unsubscribeDblClick(doubleClickHandler);
			chartRef.current?.unsubscribeCrosshairMove(ohlcMouseMoveHandler);
			containerRef.current?.removeEventListener("contextmenu",preventContext);

			chart.remove();

			chartRef.current = null;
			seriesRef.current = null;
		};
	}, [candles, chart]);

	return {
		containerRef,
		ohlcLabel,
		copyMenuContext,
		closeCopyMenu,
	} as const;
};

export default useJournalChartPreview;