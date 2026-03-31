import {
	Box,
	Text,
	Flex,
	Input,
	IconButton,
	VStack,
	Button,
	HStack,
} from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';

import type { Candle, Timeframe } from '../../../shared/candles.types';
import type { DbSymbol } from '../../../shared/trades.types';

import { isTimeframeValid } from '../hooks/useTradeCharts';
import useDraft from '../hooks/useDraft';

import DatePicker from './DatePicker';
import OhlcLabel from './OhlcLabel';
import CopyMenu from './CopyMenu';

import { getCandlesForRange } from "../api/candles";
import SymbolSelect from './SymbolSelect';
import useSymbolId from '../hooks/useSymbolId';
import useJournalChartPreview from '../hooks/useJournalChartPreview';
import type { Direction } from '../hooks/useJournalTrades';
import type { TempJournalChart } from '../hooks/useJournalCharts';
import useJournalContext from '../hooks/useJournalContext';
import EditJournalTrade from './EditJournalTrade';

const formatDateTime = (value: string | Date) =>
	new Date(value).toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

type Props = {
	idx: number;
	chart: TempJournalChart,

	symbols: DbSymbol[];
	parentLoading: boolean;
	disabled?: boolean;
};

export default function JournalChartPreview({
	idx,
	chart,
	symbols,
	parentLoading,
	disabled = false,
}: Props) {
	const {
		tempId,
		start,
		end,
		timeframe,
	} = chart;

	const [candles, setCandles] = useState<Candle[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [draftTf, setDraftTf] = useDraft(timeframe);
	const [drawingTrade, setDrawingTrade] = useState<Direction | null>(null);

	const { trades, updateChart, removeChart } = useJournalContext();
	const [openTradeId, setOpenTradeId] = useState<string | null>(null);

	const openTrade = useMemo(
		() =>
			openTradeId
				? trades.find(t => t.tempId === openTradeId) ?? null
				: null,
		[openTradeId, trades]
	);

	const {
		symbolId,
		setSymbolId,
		isSupported
	} = useSymbolId();

	const symbol = useMemo(
		() => symbols.find(s => s.id == Number(symbolId)) ?? null,
		[symbols, symbolId],
	);

	const relevantTrades = useMemo(
		() => trades
			.filter(t => t.symbolId === Number(symbolId))
			.sort((a, b) => {
				const aTime = a.orders[0].date.getTime();
				const bTime = b.orders[0].date.getTime();
				return bTime - aTime;
			}),
		[symbolId, trades]
	);

	const {
		containerRef,
		ohlcLabel,
		copyMenuContext,
		closeCopyMenu,
	} = useJournalChartPreview(
		chart,
		candles,
		relevantTrades,
		drawingTrade,
		openTrade,
		setOpenTradeId,
		setDrawingTrade,
	);

	const commitTimeframe = () => {
		updateChart(tempId, { timeframe: draftTf as Timeframe });

		if (!isTimeframeValid(draftTf)) {
			setError("Invalid timeframe value");
		} else {
			setError(null);
		}
	};

	const canPlaceTrade =
		!disabled &&
		!loading &&
		!error &&
		candles.length > 0 &&
		Number(symbolId) > 0;

	useEffect(() => {
		if (!isSupported || symbol == null) return;

		setLoading(true);
		setError(null);

		getCandlesForRange(
			symbol.name,
			chart.timeframe,
			Number(chart.start),
			Number(chart.end)
		)
			.then(setCandles)
			.catch((e) => {
				setError(e?.message ?? "Failed to load candles");
				setCandles([]);
			})
			.finally(() => setLoading(false));

	}, [chart, symbol, isSupported]);

	useEffect(() => {
		updateChart(tempId, { symbolId: Number(symbolId) });
	}, [symbolId]);

	return (
		<Box
			key={tempId}
			p={3}
			borderWidth="1px"
			borderRadius="md"
		>
			<Flex justify="space-between" align="center" mb={3}>
				<Text fontSize="sm" fontWeight="medium">
					Chart #{idx}
				</Text>
				<Flex gap={2} align="center">
					{disabled ? null : (
						<IconButton
							aria-label="Remove chart"
							size="xs"
							variant="ghost"
							onClick={() => removeChart(tempId)}
						>
							✕
						</IconButton>
					)}
				</Flex>
			</Flex>

			<VStack align="stretch" gap={5}>

				<SymbolSelect
					symbols={symbols}
					loading={parentLoading}
					symbolId={symbolId}
					setSymbolId={setSymbolId}
				/>

				<Flex gap={3} wrap="wrap" mb={3}>
					<Box minW="140px">
						<Text fontSize="xs" color="fg.muted" mb={1}>
							Timeframe
						</Text>
						<Input
							disabled={disabled}
							value={draftTf}
							onChange={e => setDraftTf(e.target.value)}
							onBlur={commitTimeframe}
							placeholder="e.g. 5m or 15000"
						/>
					</Box>
				</Flex>
			</VStack>

			<Box borderWidth="1px" borderRadius="md" mt={3} p={3}>
				<Flex justify="space-between" align="center" mb={2}>
					<Text fontSize="sm" color="fg.muted">
						Chart preview
						{symbol ? `- ${symbol.name}` : ""}
						{timeframe ? ` [${timeframe}]` : ""}
					</Text>

					<Flex gap={2} align="center">
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
				</Flex>

				<Flex gap={3} wrap="wrap" mb={3}>
					<Box minW="200px">
						<DatePicker
							disabled={disabled}
							label="Start"
							epoch={start ? Number(start) : undefined}
							onChangeEpoch={(start) => start && updateChart(tempId, { start })}
						/>
					</Box>

					<Box minW="200px">
						<DatePicker
							disabled={disabled}
							label="End"
							epoch={end ? Number(end) : undefined}
							onChangeEpoch={(end) => end && updateChart(tempId, { end })}
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
					mb={5}
				>
					<Box
						position="absolute"
						top="8px"
						right="8px"
						zIndex={10}
						pointerEvents="auto"
					>
						{/* <Flex gap={2}>
							<Button
								size="xs"
								variant={drawingMode ? "solid" : "outline"}
								disabled={!canInteract}
								onClick={drawButtonOnclick}
							>
								{drawingMode ? "Drawing…" : "Draw line"}
							</Button>

							<Button
								size="xs"
								variant="outline"
								disabled={!canInteract}
								onClick={deleteSelectedLine}
							>
								Delete
							</Button>
						</Flex> */}
					</Box>
					<Box
						position="absolute"
						top="8px"
						right="8px"
						zIndex={10}
						pointerEvents="auto"
					>
						<Flex gap={2}>
							<Button
								size="xs"
								variant={drawingTrade === "Long" ? "solid" : "outline"}
								disabled={!canPlaceTrade}
								onClick={() => setDrawingTrade(prev => prev === "Long" ? null : "Long")}
							>
								{drawingTrade === "Long" ? "Click chart…" : "Long"}
							</Button>

							<Button
								size="xs"
								variant={drawingTrade === "Short" ? "solid" : "outline"}
								disabled={!canPlaceTrade}
								onClick={() => setDrawingTrade(prev => prev === "Short" ? null : "Short")}
							>
								{drawingTrade === "Short" ? "Click chart…" : "Short"}
							</Button>
						</Flex>
					</Box>

					<OhlcLabel values={ohlcLabel} />

					<CopyMenu
						context={copyMenuContext ?? undefined}
						onClose={closeCopyMenu}
					/>

					<EditJournalTrade
						closeDialog={() => setOpenTradeId(null)}
						trade={openTrade}
					/>

					{!loading && !error && candles.length === 0 && (
						<Flex
							h="100%"
							align="center"
							justify="center"
							fontSize="xs"
							color="fg.muted"
						>
							Select start &amp; end to preview the chart.
						</Flex>
					)}
				</Box>

				<VStack align="stretch" gap={2}>
					{relevantTrades.map((trade) => {

						const first = formatDateTime(trade.orders[0].date);
						const last = formatDateTime(trade.orders.at(-1)!.date);
						const pnl = trade.pnl;

						return (
							<Box
								key={trade.tempId}
								p={2}
								borderWidth="1px"
								borderRadius="md"
								onClick={() => setOpenTradeId(trade.tempId)}
							>
								<Flex justify="space-between" gap={3} align="center" w="100%">
									<HStack gap={2} flex="1" minW={0}>
										<Text fontSize="sm" whiteSpace="nowrap"> from: {first};</Text>
										<Text fontSize="sm" lineClamp={1}> to: {last} </Text>
										<Text fontSize="xs" color={pnl >= 0 ? "green.600" : "red.400"}>
											pnl: {pnl.toFixed(2)}
										</Text>
									</HStack>
								</Flex>
							</Box>
						);
					})}
				</VStack>
			</Box>
		</Box>
	);
}