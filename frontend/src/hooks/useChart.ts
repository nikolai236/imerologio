import {
	CandlestickSeries,
	ColorType,
	createChart,
	CrosshairMode,
	type IChartApi,
	type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { Candle, Timeframe } from "../../../shared/candles.types";
import TradePosition from "../chart-plugins/trade-position";
import useTradeContext from "./useTradeContext";
import useOhlcLabel from "./useOhlcLabel";
import useCopyMenu from "./useCopyMenu";
import useDrawLines from "./useDrawLines";
import type { ChartLine } from "../../../shared/trades.types";

const SECOND = 1000;

const timeFormatter = (unixEpoch: number) => {
	return new Date(unixEpoch * SECOND).toLocaleString("en-US", {
		timeZone: "America/New_York",
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

const useChart = (
	candles: Candle[],
	timeframe: Timeframe,
	lineMode: boolean,
	lines: ChartLine[],
	commitLines: (lines: ChartLine[]) => void,
) => {
	const { getEntryForTf, getExitsForTf, stop, target } = useTradeContext();

	const containerRef = useRef<HTMLDivElement | null>(null);
	const chartRef = useRef<IChartApi | null>(null);

	const seriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);

	const { ohlc, changeOhlcOnMouseMove } = useOhlcLabel(seriesRef);
	const { position, handleCopyClick, closeMenu } = useCopyMenu(seriesRef);

	const {
		attachAll,
		lineClickHandler,
		lineMouseMoveHandler,
	} = useDrawLines(seriesRef, lines, closeMenu, commitLines);

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
		if (containerRef.current == null || candles.length === 0) return;

		if (chartRef.current != null) {
			chartRef.current.remove();
			chartRef.current = null;
			seriesRef.current = null;
		}

		const chart = createChart(containerRef.current, getConfig());
		const series = chart.addSeries(CandlestickSeries, {
			upColor: "#ffffff",
			downColor: "#000000",
			borderUpColor: "#000000",
			borderDownColor: "#000000",
			wickUpColor: "#000000",
			wickDownColor: "#000000",
		});

		seriesRef.current = series;

		series.setData(candles.map(transformCandle));
		series.applyOptions({
			priceFormat: {
				type: "price",
				precision: 6,
				minMove: 0.000001,
			},
		});

		attachAll();

		chart.subscribeCrosshairMove(changeOhlcOnMouseMove);

		if (lineMode) {
			chart.subscribeClick(lineClickHandler);
			chart.subscribeCrosshairMove(lineMouseMoveHandler);
		} else {
			chart.subscribeClick(handleCopyClick);
		}

		const preventContext = (e: Event) => e.preventDefault();
		containerRef.current.addEventListener("contextmenu", preventContext, { capture: true });

		try {
			const entry = getEntryForTf(timeframe);
			if (entry == null) throw new Error("Entry is not defined");

			const direction = Number(stop) > entry.price ? "SELL" : "BUY";

			const trade = new TradePosition(
				[entry],
				getExitsForTf(timeframe),
				Number(stop),
				direction,
				Number(target)
			);

			series.attachPrimitive(trade);
		} catch (err) {
			console.error(err);
		}

		chartRef.current = chart;

		const handleResize = () => {
			if (!containerRef.current || !chartRef.current) return;
			chartRef.current.applyOptions({
				width: containerRef.current.clientWidth || undefined,
			});
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);

			// unsubscribe correct click handler
			if (chartRef.current) {
				if (lineMode) {
					chartRef.current.unsubscribeCrosshairMove(lineMouseMoveHandler);
					chartRef.current.unsubscribeClick(lineClickHandler);
				} else {
					chartRef.current.unsubscribeClick(handleCopyClick);
				}
				chartRef.current.unsubscribeCrosshairMove(
					changeOhlcOnMouseMove
				);
			}

			containerRef.current?.removeEventListener(
				"contextmenu", preventContext, { capture: true }
			);

			chart.remove();
			chartRef.current = null;
			seriesRef.current = null;
		};
	}, [candles, timeframe, lineMode]);

	return {
		menu: position,
		ohlc,
		containerRef,
		closeMenu,
	};
};

export default useChart;