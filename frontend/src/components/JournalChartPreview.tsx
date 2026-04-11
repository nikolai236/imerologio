import {
	Box,
	Text,
	Flex,
	Input,
	IconButton,
	VStack,
	Button,
	HStack,
	Checkbox,
} from '@chakra-ui/react';

import type { Timeframe } from '../../../shared/candles.types';
import type { TempJournalTrade } from '../hooks/useJournalTrades';

import DatePicker from './DatePicker';
import OhlcLabel from './OhlcLabel';
import CopyMenu from './CopyMenu';
import SymbolSelect from './SymbolSelect';
import EditJournalTrade from './EditJournalTrade';

import { isTimeframeValid } from '../hooks/useTradeCharts';
import useDraft from '../hooks/useDraft';
import useJournalChartPreview from '../hooks/useJournalChartPreview';
import useJournalContext from '../hooks/useJournalContext';
import useJournalChartContext from '../hooks/useJournalChartContext';
import { useState } from 'react';
import RangeCalendar from './RangeCalendar';

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
	parentLoading: boolean;
	disabled?: boolean;
};

function TradeRow({ trade }: { trade: TempJournalTrade }) {
	const { shouldShow, } = useJournalContext();
	const { chart, setOpenTradeId } = useJournalChartContext();

	const first = formatDateTime(trade.orders[0].date);
	const last = formatDateTime(trade.orders.at(-1)!.date);
	const pnl = trade.pnl;

	const [show, setShow] = useState(true);
	const toggleShow = (show: boolean) => {
		if (!shouldShow(trade, chart)) {
			setShow(false);
			return;
		}

		setShow(show);
	};

	return (
		<Box
			key={trade.tempId}
			p={2}
			borderWidth="1px"
			borderRadius="md"
			onClick={() => setOpenTradeId(trade.tempId)}
		>
			<Flex
				justify="space-between"
				gap={3}
				align="center"
				w="100%"
			>
				<HStack gap={2} flex="1" minW={0}>
					<Text fontSize="sm" whiteSpace="nowrap"> from: {first};</Text>
					<Text fontSize="sm" lineClamp={1}> to: {last} </Text>
					<Text fontSize="xs" color={pnl >= 0 ? "green.600" : "red.400"}>
						pnl: {pnl.toFixed(2)}
					</Text>
				</HStack>

				<Checkbox.Root
					checked={show}
					onClick={e => e.stopPropagation()}
					onCheckedChange={({ checked }) => toggleShow(!!checked)}
				>
					<Checkbox.HiddenInput />
					<Checkbox.Control>
						<Checkbox.Indicator />
					</Checkbox.Control>
					<Checkbox.Label />
				</Checkbox.Root>
			</Flex>
		</Box>
	);
}

export default function JournalChartPreview({
	idx,
	parentLoading,
	disabled = false,
}: Props) {
	const {
		chart,
		trades: relevantTrades,
		symbols,

		symbol,
		candles,

		openTrade,
		setOpenTradeId,

		drawingTrade,
		setDrawingTrade,

		containerRef,

		loading,

		error,
		setError,

		setSymbolId,
	} = useJournalChartContext();

	const {
		tempId,
		start,
		end,
		timeframe,
	} = chart;

	const [draftTf, setDraftTf] = useDraft(timeframe);

	const { updateChart, removeChart } = useJournalContext();

	const {
		ohlcLabel,
		copyMenuContext,
		closeCopyMenu,
	} = useJournalChartPreview();

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
		Number(chart.symbolId) > 0;

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
					symbolId={String(chart.symbolId ?? "")}
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
					{relevantTrades.map((trade, i) =>
						<TradeRow trade={trade} key={i} />
					)}
				</VStack>

				<RangeCalendar start={start} end={end} />
			</Box>
		</Box>
	);
}