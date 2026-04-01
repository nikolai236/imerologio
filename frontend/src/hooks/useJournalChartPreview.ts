import {
	CandlestickSeries,
	ColorType,
	createChart,
	CrosshairMode,
	type MouseEventParams,
	type Time,
	type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, } from "react";

import type { Candle } from "../../../shared/candles.types";

import useOhlcLabel from "./useOhlcLabel";
import useCopyMenu from "./useCopyMenu";
import useDrawJournalTrades from "./useDrawJournalTrades";
import useJournalChartContext from "./useJournalChartContext";

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

const useJournalChartPreview = () => {
	const {
		chart,
		candles,
		seriesRef,
		chartRef,
		containerRef,
	} = useJournalChartContext();

	const { ohlcLabel, ohlcMouseMoveHandler } = useOhlcLabel(seriesRef);
	const { copyMenuContext, copyClickHandler, closeCopyMenu } = useCopyMenu(seriesRef);

	const {
		drawingTradeRef,
		dragStateRef,
		tradeSelectionHandler,
		onClickTradeHandler,
		attachPrimitives,
		doubleClickHandler,
		setupTradesResizeEventListeners,
		clearTradesResizeEventListeners,
		selectedTradeRef,
		deleteSelectedTrade,
	} = useDrawJournalTrades();

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