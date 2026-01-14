import { CandlestickSeries, ColorType, createChart, CrosshairMode, type BarData, type IChartApi, type MouseEventParams, type Time, type UTCTimestamp } from "lightweight-charts";
import { useEffect,  useRef } from "react";
import type { Candle, Timeframe } from "../../../shared/candles.types";
import TradePosition from "../chart-plugins/trade-position";
import useTradeContext from "./useTradeContext";
import useOhlc from "./useOhlc";

const SECOND = 1000;

const timeFormatter = (unixEpoch: number) => {
	return new Date(unixEpoch * SECOND)
		.toLocaleString('en-US', {
			timeZone: "America/New_York",
			day: "numeric",
			month: "short",
			year: "2-digit",
			hour: "numeric",
			minute: "2-digit"
		});
};

const useChart = (candles: Candle[], timeframe: Timeframe) => {
	const { getEntry, getExits, stop, target } = useTradeContext();
	const { ohlc, changeOhlcOnMouseMove, } = useOhlc();

	const containerRef = useRef<HTMLDivElement|null>(null);
	const chartRef = useRef<IChartApi|null>(null);

	const getConfig = () => ({
		height: 500,
		width: containerRef.current?.clientWidth || undefined,
		layout: {
			textColor: "#ffffffff",
			background: {
				type: ColorType.Solid,
				color: "transparent"
			},
		},
		rightPriceScale: {
			borderVisible: false,
		},
		timeScale: {
			borderVisible: false,
		},
		localization: {
			timeFormatter
		}, 
		crosshair: {
			mode: CrosshairMode.Normal,
		},
	});

	const transformCandle = (candle: Candle) => ({
		time: Math.floor(candle.time) / 1000 as UTCTimestamp,

		open: candle.open,
		high: candle.high,
		low:  candle.low,
		close: candle.close,
	});

	useEffect(() => {
		if (containerRef.current == null || candles.length == 0) return;

		// destroyOhlc();

		if (chartRef.current != null) {
			chartRef.current.remove();
			chartRef.current = null;
		}

		const chart = createChart(containerRef.current, getConfig());
		const series = chart.addSeries(CandlestickSeries, {});

		series.setData(candles.map(transformCandle));
		series.applyOptions({ priceFormat: {
			type: "price",
			precision: 6,
			minMove: 0.000001,
		}});

		const getPrice = (param: MouseEventParams<Time>) =>
			param.seriesData.get(series) as BarData<Time>;

		const handler = changeOhlcOnMouseMove(getPrice);
		chart.subscribeCrosshairMove(handler);

		try {

			const entry = getEntry(timeframe);
			const direction = Number(stop) > entry.price ? 'SELL' : 'BUY';

			const r = new TradePosition(
				[entry],
				getExits(timeframe),
				Number(stop),
				direction,
				Number(target)
			);

			series.attachPrimitive(r);

		} catch(err) {
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
			chart.unsubscribeCrosshairMove(handler);
			chart.remove();
			chartRef.current = null;
		};

	}, [candles]);

	return {
		ohlc, containerRef,
	};
};

export default useChart;