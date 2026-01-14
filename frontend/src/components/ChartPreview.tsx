import {
	Box,
	Text,
	Flex,
	Input,
	IconButton,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import DatePicker from './DatePicker';
import type { Candle, Timeframe } from '../../../shared/candles.types';
import useCandles from '../hooks/useCandles';
import useTradeCharts from '../hooks/useTradeCharts';
import useTradeContext from '../hooks/useTradeContext';
import useChart from '../hooks/useChart';
import OhlcLabel from './OhlcLabel';
import useDraft from '../hooks/useDraft';

type Props = {
	num: number;
	id: string;
	symbol: string;
	start: number;
	end: number;

	timeframe: Timeframe;
	disabled?: boolean;
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

	const { isTimeframeValid } = useTradeCharts();
	const { getCandlesForRange } = useCandles();

	const [candles, setCandles] = useState<Candle[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string|null>(null);
	const [draftTimeframe, setDraftTimeframe] = useDraft(timeframe);

	const { containerRef, ohlc } = useChart(candles, timeframe);

	useEffect(() => {
		if (!symbol) return;

		setLoading(true);
		setError(null);

		getCandlesForRange(symbol, timeframe, Number(start), Number(end))
			.then(setCandles)
			.catch((e) => {
				setError(e?.message ?? "Failed to load candles");
				setCandles([]);
			})
			.finally(() => setLoading(false));

	}, [symbol, id, start, end, timeframe]);

	const commitTimeFrame = () => {
		updateChart(id, { timeframe: draftTimeframe as Timeframe });

		if(!isTimeframeValid(draftTimeframe)) {
			return setError("Invalid timeframe value");
		}
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
					value={draftTimeframe}
					onChange={e => setDraftTimeframe(e.target.value)}
					onBlur={commitTimeFrame}
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
					<DatePicker
						disabled={disabled}
						label="Start"
						epoch={start ? Number(start) : undefined}
						onChangeEpoch={(start) => start && updateChart(id, { start })}
					/>
				</Box>

				<Box minW="200px">
					<DatePicker
						disabled={disabled}
						label="End"
						epoch={end ? Number(end) : undefined}
						onChangeEpoch={(end) => end && updateChart(id, { end })}
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