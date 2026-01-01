import { useEffect, useMemo, useState } from "react";
import {
	Box,
	Button,
	CloseButton,
	Flex,
	HStack,
	Input,
	NativeSelect,
	Text,
	VStack,
	Tag,
} from "@chakra-ui/react";
import useTradeOrders from "../hooks/useTradeOrders";
import Orders from "./Orders";
import useSymbols from "../hooks/useSymbols";
import useLabels from "../hooks/useLabels";
import type { LabelWithId, Order, SymbolWithId, TradeWithOrders } from "../../../shared/trades.types";
import SelectLabels from "./SelectLabels";
import DescriptionEditor from "./DescriptionEditor";
import useTrades from "../hooks/useTrades";
import ChartPreview from "./ChartPreview";
import useTradeCharts from "../hooks/useTradeCharts";
import useCandles from "../hooks/useCandles";
import type { ChartStringTf } from "../../../shared/candles.types";

const parseDecimalString = (s: string) => {
	if (!s) return null;
	const n = Number(s);

	if (!Number.isFinite(n)) return null;
	return s;
}

export default function CreateTrade() {
	const {
		orders,
		orderSum,
	
		setOrders,
		updateOrder,
		addOrder,
		removeOrder,
	} = useTradeOrders(new Date());

	const {
		charts,
		addChart,
		removeChart,
		updateChart,
	} = useTradeCharts();

	const { isSupported } = useCandles();
	const { getSymbols } = useSymbols();
	const { getLabels } = useLabels();
	const { createTrade } = useTrades();

	const [symbols, setSymbols] = useState<SymbolWithId[]>([]);
	const [labels, setLabels] = useState<LabelWithId[]>([]);
	const [loadingSymbols, setLoadingSymbols] = useState(false);
	const [loadingLabels, setLoadingLabels] = useState(false);

	const [symbolId, setSymbolId] = useState(''); // NativeSelect gives string
	const [stop, setStop] = useState('');
	const [target, setTarget] = useState('');
	const [description, setDescription] = useState('');

	const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
	const selectedLabels = useMemo(
		() => selectedLabelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean) as LabelWithId[],
		[selectedLabelIds, labels]
	);

	const [chartsDisabled, setChartsDisabled] = useState(true);
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const [labelsOpen, setLabelsOpen] = useState(false);

	useEffect(() => {
		setLoadingSymbols(true);
		getSymbols()
			.then(setSymbols)
			.catch(console.error)
			.then(() => setLoadingSymbols(false));
	}, []);

	useEffect(() => {
		setLoadingLabels(true);
		getLabels()
			.then(setLabels)
			.catch(console.error)
			.then(() => setLoadingLabels(false));
	}, []);

	useEffect(() => {
		if (!symbolId) return;

		isSupported(Number(symbolId))
			.then(v => !v)
			.then(setChartsDisabled)
			.catch(console.error);
	}, [symbolId]);

	const removeLabel = (id: number) => setSelectedLabelIds(
		(prev) => prev.filter((x) => x !== id)
	);

	const validate = () => {
		setFormError(null);

		const sId = Number(symbolId);
		if (!Number.isInteger(sId) || sId <= 0) throw new Error("Please select a valid symbol.");

		const stopStr = parseDecimalString(stop);
		if (!stopStr) throw new Error("Stop must be a valid number.");

		const targetStr = parseDecimalString(target);
		if (target.trim() && !targetStr) throw new Error("Target must be a valid number.");

		if (orders.length === 0) throw new Error("Please add at least one order.");

		if (orderSum !== 0) {
			throw new Error(`Orders must net to 0. Current net quantity is ${orderSum} (BUY is +, SELL is -).`);
		}

		const validatedOrders = orders.map(({ price, quantity, date, type }) => ({
			price: Number(price),
			quantity: Number(quantity),
			date,
			type,
		}));

		const validatedCharts: ChartStringTf[] = charts.map(c => ({
			...c,
			tempId: undefined,
		}));

		const ret: TradeWithOrders<ChartStringTf> = {
			stop: Number(stop.trim()),
			target: target.trim() != '' ? Number(target.trim()) : undefined,
			description,
			pnl: undefined,
			labels: selectedLabelIds.map(id => ({ id })),
			charts: validatedCharts,
			orders: validatedOrders,
			symbolId: Number(symbolId),
		};

		const tradeBodythrowConds = [ret.target, ret.stop, ret.symbolId]
			.some(r => r != undefined && isNaN(r));

		if (tradeBodythrowConds) {
			throw new Error("Trade value is not a number");
		}

		if (validatedOrders.some(({ quantity }) => !Number.isInteger(quantity) || quantity < 1)) {
			throw new Error("Quantities should be whole numbers >= 1")
		}

		const orderThrowCond = (o: Order) => [o.price, o.quantity, o.date.getTime()].some(r => isNaN(r))
		if (validatedOrders.some(orderThrowCond)) {
			throw new Error("Trade value is not a number");
		}

		return ret;
	};

	const submit = async() => {
		let trade: TradeWithOrders<ChartStringTf>;
		try {
			trade = validate();
		} catch (err: any) {
			return setFormError(err.message);
		}

		setSubmitting(true);
		setFormError(null);

		try {

			await createTrade(trade);

			setStop("");
			setTarget("");
			setDescription("");
			setSelectedLabelIds([]);
			setOrders([]);

		} catch (e: any) {
			setFormError(e?.message ?? "Failed to create trade");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Box p={6} maxW="1000px" mx="auto">
			<Text fontSize="2xl" fontWeight="bold" mb={4}>
				Create Trade
			</Text>

			{formError ? (
				<Box mb={4} p={3} borderWidth="1px" borderRadius="md">
					<Text color="red.400">{formError}</Text>
				</Box>
			) : null}

			<VStack align="stretch" gap={5}>
				{/* Top row: Symbol / Stop / Target */}
				<Flex gap={4} wrap="wrap" align="flex-end">
					<Box minW="260px" flex="1">
						<Text fontSize="sm" color="fg.muted" mb={1}>
							Symbol
						</Text>
						<NativeSelect.Root disabled={loadingSymbols}>
							<NativeSelect.Field
								value={symbolId}
								onChange={(e) => setSymbolId(e.target.value)}
							>
								{symbols.map((s) => (
									<option key={s.id} value={String(s.id)}>
										{s.name} ({s.type})
									</option>
								))}
							</NativeSelect.Field>
						</NativeSelect.Root>
					</Box>

					<Box minW="160px">
						<Text fontSize="sm" color="fg.muted" mb={1}>
							Stop
						</Text>
						<Input value={stop} onChange={(e) => setStop(e.target.value)} placeholder="e.g. 19250.25" />
					</Box>

					<Box minW="160px">
						<Text fontSize="sm" color="fg.muted" mb={1}>
							Target (optional)
						</Text>
						<Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 19310.00" />
					</Box>
				</Flex>

				{/* Labels */}
				<Box>
					<Flex align="center" justify="space-between" wrap="wrap" gap={3}>
						<Box>
							<Text fontSize="sm" color="fg.muted">
								Labels
							</Text>
							<Text fontSize="xs" color="fg.muted">
								Selected {selectedLabelIds.length}
							</Text>
						</Box>

						<Button
							variant="outline"
							onClick={() => setLabelsOpen(true)}
							disabled={loadingLabels}
						> Add / Search Labels
						</Button>
					</Flex>

					{selectedLabels.length ? (
						<HStack mt={3} wrap="wrap" gap={2}>
							{selectedLabels.map((l) => (
								<Tag.Root key={l.id} borderRadius="full">
									<Tag.Label>{l.name}</Tag.Label>
									<CloseButton
										size="sm"
										ml={1}
										onClick={() => removeLabel(l.id)}
										aria-label={`Remove ${l.name}`}
									/>
								</Tag.Root>
							))}
						</HStack>
					) : (
						<Text mt={3} color="fg.muted" fontSize="sm">
							No labels selected.
						</Text>
					)}
				</Box>

				{/* divider replacement */}
				<Box borderBottomWidth="1px" />

				<Orders
					removeOrder={removeOrder}
					addOrder={addOrder}
					orders={orders}
					orderSum={orderSum}
					updateOrder={updateOrder} />

				{/* divider replacement */}
				<Box borderBottomWidth="1px" />

				{/* Description (Lexical) */}
				<Box>
					<Text fontSize="sm" color="fg.muted" mb={2}>
						Description
					</Text>

					<DescriptionEditor
						valueHtml={description}
						onChangeHtml={setDescription}
						placeholder="Write your trade notes…"
					/>

					<Text fontSize="xs" color="fg.muted" mt={2}>
						Saves HTML to your description field.
					</Text>
				</Box>

				{/* divider replacement */}
				<Box borderBottomWidth="1px" />

				{/* Charts */}
				<Box>
					<Flex justify="space-between" align="center" mb={3}>
						<Box>
							<Text fontSize="sm" color="fg.muted">
								Charts
							</Text>
							<Text fontSize="xs" color="fg.muted">
								Attach any number of chart previews to this trade.
							</Text>
						</Box>

						<Button
							variant="outline"
							size="sm"
							onClick={addChart}
							disabled={chartsDisabled}
						> Add Chart
						</Button>
					</Flex>

					{charts.length === 0 && (
						<Text fontSize="sm" color="fg.muted">
							No charts added. Click &quot;Add Chart&quot; to attach one.
						</Text>
					)}

					<VStack align="stretch" gap={4} mt={charts.length ? 2 : 0}>
					{charts.map((c, i) =>
						<ChartPreview
							num={i+1}
							timeframe={c.timeframe}
							symbol={symbols.find(s => s.id == Number(symbolId))!.name}
							id={c.tempId}
							key={c.tempId}
							start={c.start}
							end={c.end}
							removeChart={removeChart}
							updateChart={updateChart}
						/>)
					}
					</VStack>
				</Box>

				{/* divider replacement */}
				<Box borderBottomWidth="1px" />

				{/* Submit */}
				<Flex justify="flex-end" gap={3}>
					<Button variant="outline" onClick={() => window.history.back()}>
						Cancel
					</Button>
					<Button onClick={submit} loading={submitting} disabled={submitting}>
						Create Trade
					</Button>
				</Flex>
			</VStack>

			<SelectLabels
				labels={labels}
				open={labelsOpen}
				selectedIds={selectedLabelIds}
				setSelectedIds={setSelectedLabelIds}
				setLabelsOpen={setLabelsOpen}
			/>
		</Box>
	);
}
