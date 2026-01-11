import {
	Box,
	Text,
	Flex,
	Input,
	IconButton,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import type { Candle, Timeframe } from '../../../shared/candles.types';
import useCandles from '../hooks/useCandles';
import useTradeCharts from '../hooks/useTradeCharts';
import useTradeContext from '../hooks/useTradeContext';
import useTimezones from '../hooks/useTimezones';
import useChart from '../hooks/useChart';
import OhlcLabel from './OhlcLabel';

type Props = {
	num: number;
	id: string;
	symbol: string;
	start: number;
	end: number;

	timeframe: Timeframe;
	disabled?: boolean;
};

const SECOND = 1000;

const formatTime = (unixEpoch: number) => {
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

export default function ChartPreview({
	id,
	num,
	symbol,
	start,
	end,
	timeframe,
	disabled = false,
}: Props) {
	const {
		removeChart,
		updateChart,
	} = useTradeContext();

	const { epochToDateStrInTZ,  dateStrToDateInTZ } = useTimezones();
	const { isTimeframeValid } = useTradeCharts();
	const { getCandlesForRange } = useCandles();

	const [candles, setCandles] = useState<Candle[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string|null>(null);

	const { containerRef, ohlc } = useChart(candles, timeframe);

	useEffect(() => {
		if (!symbol) return;

		let cancelled = false;

		setLoading(true);
		setError(null);

		getCandlesForRange(symbol, timeframe, Number(start), Number(end))
			.then((rows) => !cancelled && setCandles(rows))
			.catch((e: any) => !cancelled && setError(e?.message ?? "Failed to load OHLCV"))
			.finally(() => setLoading(false));

		return () => {
			cancelled = true;
		};
	}, [symbol, id, start, end, timeframe]);

	const handleTimeframeChange = (value: string) => {
		updateChart(id, { timeframe: value as Timeframe });

		if(!isTimeframeValid(value)) {
			return setError("Invalid timeframe value");
		}
		return setError(null);
	};

	const handleStartChange = (value: string) => {
		if (!value) return setError("Invalid start value");

		const start = dateStrToDateInTZ(value);
		updateChart(id, { start });

		return setError(null);
	};

	const handleEndChange = (value: string) => {
		if (!value) return setError("Invalid end value");

		const end = dateStrToDateInTZ(value);
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
				<Flex gap={2} align="center">

				{disabled ? null : (
					<IconButton
						aria-label="Remove chart"
						size="xs"
						variant="ghost"
						onClick={() => removeChart(id)}
					>
						✕
					</IconButton>
				)}
				</Flex>
			</Flex>

		<Flex gap={3} wrap="wrap" mb={3}>

			<Box minW="140px">
				<Text fontSize="xs" color="fg.muted" mb={1}>
					Timeframe
				</Text>
				<Input
					disabled={disabled}
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
						disabled={disabled}
						type="datetime-local"
						value={epochToDateStrInTZ(start != undefined ? Number(start) : start)}
						onChange={(e) => handleStartChange(e.target.value)}
					/>
				</Box>

				<Box minW="200px">
					<Text fontSize="xs" color="fg.muted" mb={1}>
						End
					</Text>
					<Input
						disabled={disabled}
						type="datetime-local"
						value={epochToDateStrInTZ(end != undefined ? Number(end) : end)}
						onChange={(e: any) => handleEndChange(e.target.value)}
					/>
				</Box>
			</Flex>

			<Box
				ref={containerRef}
				h="500px"
				w="100%"
				position="relative"
				borderRadius="md"
				overflow="hidden"
				bg="bg.subtle"
			>
				<OhlcLabel ohlc={ohlc}></OhlcLabel>
				{!loading && !error && candles.length === 0 && (
				<>
					<Flex
						h="100%"
						align="center"
						justify="center"
						fontSize="xs"
						color="fg.muted"
					> Select start &amp; end to preview the chart.
					</Flex>
				</>
				)}
			</Box>
		</Box>
		</Box>
	);
}