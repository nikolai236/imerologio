import {
	Box,
	Text,
	Flex,
	Input,
	IconButton,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import type { Candle, ChartStringTf, Timeframe } from '../../../shared/candles.types';
import useCandles from '../hooks/useCandles';
import { CandlestickSeries, ColorType, type IChartApi, createChart } from 'lightweight-charts';
import useTradeCharts from '../hooks/useTradeCharts';

type Props = {
	num: number;
	id: string;
	symbol: string;
	start: number;
	end: number;
	timeframe: Timeframe;

	removeChart: (id: string) => void;
	updateChart: (id: string, payload: Partial<ChartStringTf>) => void;
};

const epochToDateStr = (epochStr?: string) => {
	if (!epochStr) return "";
	const epoch = Number(epochStr);
	if (!Number.isFinite(epoch)) return "";

	const d = new Date(epoch);

	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/New_York",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	const formatted = formatter.format(d);
	return formatted.replace(", ", "T");
};

export default function ChartPreview({
	num,
	symbol,
	id,
	start,
	end,
	timeframe,

	removeChart,
	updateChart,
}: Props) {
	const { isTimeframeValid } = useTradeCharts();
	const { getCandlesForRange } = useCandles();

	const [candles, setCandles] = useState<Candle[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string|null>(null);

	const containerRef = useRef<HTMLDivElement|null>(null);
	const chartRef = useRef<IChartApi|null>(null);

	useEffect(() => {
		if (!symbol) return;

		let cancelled = false;

		setLoading(true);
		setError(null);

		getCandlesForRange(symbol, Number(start), Number(end))
			.then((rows) => !cancelled && setCandles(rows))
			.catch((e: any) => !cancelled && setError(e?.message ?? "Failed to load OHLCV"))
			.finally(() => !cancelled && setLoading(false));

		return () => {
			cancelled = true;
		};
	}, [symbol, id, start, end]);

	// render lightweight-charts when data changes
	useEffect(() => {
		if (!containerRef.current || candles.length === 0) {
			return;
		}

		// dispose previous chart
		if (chartRef.current) {
			chartRef.current.remove();
			chartRef.current = null;
		}

		const chart = createChart(containerRef.current, {
			height: 220,
			width: containerRef.current.clientWidth || undefined,
			layout: {
				textColor: "#ccc",
				background: { type: ColorType.Solid , color: "transparent" },
			},
			rightPriceScale: {
				borderVisible: false,
			},
			timeScale: {
				borderVisible: false,
			},
		});

		const series = chart.addSeries(CandlestickSeries, {});

		series.setData(
			candles.map((row) => {
				const timeSeconds =
					row.time > 2_000_000_000 ? Math.floor(row.time / 1000) : row.time;

				return {
					time: timeSeconds as any,
					open: row.open,
					high: row.high,
					low: row.low,
					close: row.close,
				};
			})
		);

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
			chart.remove();
			chartRef.current = null;
		};
	}, [candles]);

	const handleTimeframeChange = (value: string) => {
		updateChart(id, { timeframe: value as Timeframe });

		if(!isTimeframeValid(value)) {
			return setError("Invalid timeframe value");
		}
		return setError(null);
	};

	const handleStartChange = (value: string) => {
		if (!value) return setError("Invalid start value");

		const start = new Date(value).getTime();
		updateChart(id, { start });

		return setError(null);
	};

	const handleEndChange = (value: string) => {
		if (!value) return setError("Invalid end value");

		const end = new Date(value).getTime();
		updateChart(id, { end });

		return setError(null);
	};

	return (
		<Box
			key={id}
			p={3}
			borderWidth="1px"
			borderRadius="md"
		>
			<Flex justify="space-between" align="center" mb={3}>
				<Text fontSize="sm" fontWeight="medium">
					Chart #{num}
				</Text>
				<IconButton
					aria-label="Remove chart"
					size="xs"
					variant="ghost"
					onClick={() => removeChart(id)}
				> ✕ </IconButton>
			</Flex>

		<Flex gap={3} wrap="wrap" mb={3}>

			<Box minW="140px">
				<Text fontSize="xs" color="fg.muted" mb={1}>
					Timeframe
				</Text>
				<Input
					value={timeframe}
					onChange={e => handleTimeframeChange(e.target.value)}
					placeholder="e.g. 5m or 15000"
				/>
			</Box>
		</Flex>
		<Box borderWidth="1px" borderRadius="md" mt={3} p={3}>
			<Flex justify="space-between" align="center" mb={2}>
				<Text fontSize="sm" color="fg.muted">
					Chart preview
					{symbol ? `- ${symbol}` : ""}
					{timeframe ? ` [${timeframe}]` : ""}
				</Text>
				{loading && (
					<Text fontSize="xs" color="fg.muted">
						Loading…
					</Text>
				)}
				{error && (
					<Text fontSize="xs" color="red.400">
						{error}
					</Text>
				)}
			</Flex>

			<Flex gap={3} wrap="wrap" mb={3}>
				<Box minW="200px">
					<Text fontSize="xs" color="fg.muted" mb={1}>
						Start
					</Text>
					<Input
						type="datetime-local"
						value={epochToDateStr(start != undefined ? start.toString() : start)}
						onChange={(e) => handleStartChange(e.target.value)}
					/>
				</Box>

				<Box minW="200px">
					<Text fontSize="xs" color="fg.muted" mb={1}>
						End
					</Text>
					<Input
						type="datetime-local"
						value={epochToDateStr(end != undefined ? end.toString() : end)}
						onChange={(e: any) => handleEndChange(e.target.value)}
					/>
				</Box>
			</Flex>

			<Box
				ref={containerRef}
				h="220px"
				w="100%"
				borderRadius="md"
				overflow="hidden"
				bg="bg.subtle"
			>
				{!loading && !error && candles.length === 0 && (
					<Flex
						h="100%"
						align="center"
						justify="center"
						fontSize="xs"
						color="fg.muted"
					> Select start &amp; end to preview the chart.
					</Flex>
				)}
			</Box>
		</Box>
		</Box>
	);
}