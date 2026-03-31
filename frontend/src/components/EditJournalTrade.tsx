import {
	Button,
	DialogBackdrop,
	DialogBody,
	DialogCloseTrigger,
	DialogContent,
	DialogHeader,
	DialogPositioner,
	DialogRoot,
	DialogTitle,
	Text,
	Box,
	VStack,
	DialogFooter,
	Flex,
} from "@chakra-ui/react";
import type { TempJournalTrade } from "../hooks/useJournalTrades";
import { useCallback, useMemo } from "react";
import OrderRow from "./OrderRow";
import useJournalContext from "../hooks/useJournalContext";
import StopInput from "./StopInput";
import type { Price } from "../hooks/useDraft";
import TargetInput from "./TargetInput";
import { Timeframes } from "../../../shared/candles.types";
import useTimeframe from "../hooks/useTimeframe";
import type { UTCTimestamp } from "lightweight-charts";

type Props = {
	trade: TempJournalTrade | null;
	closeDialog: (open: boolean) => void;
};

export default function EditJournalTrade({
	trade,
	closeDialog,
}: Props) {
	if (trade == null) return null;

	const { normalizeEntry } = useTimeframe();
	const {
		getOrders,
		addOrder,
		updateOrder,
		removeOrder,
		updateTrade,
	} = useJournalContext();

	const setTarget = (target: Price) => {
		updateTrade(trade.tempId, { target: target ?? undefined });
	};

	const setStop = (stop: Price) => {
		updateTrade(trade.tempId, { stop: stop ?? undefined });
	};

	const orders = useMemo(
		() => getOrders(trade.tempId),
		[getOrders]
	);

	if (orders == null) return null;

	const orderSum = useMemo(
		() =>
			orders.reduce(
				(sum, { type, quantity }) =>
					sum +
					(type === "BUY" ? 1 : -1) *
					Number(quantity),
				0
			),
		[orders]
	);

	const pnl = useMemo(() => orders.reduce((prev, o) =>
		prev - (o.type == "BUY" ? 1 : -1) * o.quantity * o.price, 0
	), [orders]);

	const entry = useMemo(() =>{
		if (orders.length == 0) return null;

		const [order] = orders;
		const date = new Date(order.date).getTime();
		const entry = {
			price: Number(order.price),
			time: date / 1000 as UTCTimestamp,
			quantity: Number(order.quantity),
		};

		return normalizeEntry(entry, Timeframes.tf30s);
	}, [orders]);

	const risk = useMemo(() => {
		if (trade.stop == null || entry == null) return null;

		const { price: entryPrice, quantity } = entry;
		return (entryPrice - trade.stop) * quantity;

	}, [trade, entry]);

	const RR = useMemo(() => {
		if (orderSum != 0 || risk == null || entry == null) return null;

		const { price: entryPrice, quantity } = entry;

		if (!trade.target) return pnl >= 0 ?
			Math.abs(pnl / risk) : null;

		const profit = (trade.target - entryPrice) * quantity;

		if (pnl >= 0) return Math.abs(profit / risk);
		else return Math.abs(profit / pnl);

	}, [orderSum, risk, entry, pnl, trade]);

	const destroyOrder = (orderId: string) => {
		if (orders.length === 1) return;
		removeOrder(trade.tempId, orderId);
	};

	return (
		<DialogRoot
			size="lg"
			open={true}
			onOpenChange={(e) => closeDialog(e.open)}
			scrollBehavior="inside"
		>
			<DialogBackdrop />
			<DialogPositioner>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Select Labels</DialogTitle>
						<DialogCloseTrigger />
					</DialogHeader>

					<DialogBody>
						<Box mb={5}>
							<VStack align="stretch" gap={4}>
								<TargetInput target={trade.target} setTarget={setTarget}/>
								<StopInput stop={trade.stop} setStop={setStop} />
							</VStack>
						</Box>

						<Box>
							<Flex align="center" justify="space-between" wrap="wrap" gap={3} mb={3}>
								<Box>
									<Text fontSize="sm" color="fg.muted">
										Orders
									</Text>
									{orderSum !== 0 ? 
										<Text fontSize="xs" color="red.400">
											Net quantity must be 0. Current: {orderSum}
										</Text> : null
									}
									{orderSum == 0 ?
										<Text fontSize="xs" color={pnl >= 0 ? "green.600" : "red.400"}>
											pnl: {pnl.toFixed(2)}
										</Text> : null
									}
									{orderSum == 0 && risk != null ?
										<Text fontSize="xs" color="red.400">
											risk: {risk.toFixed(2)}
										</Text> : null
									}
									{orderSum == 0 && RR != null ?
										<Text fontSize="xs" color="fg.muted">
											RR: {RR.toFixed(2)}
										</Text> : null
									}
								</Box>
								<Flex align="center" gap={2}>
									<Button onClick={() => addOrder(trade.tempId)} variant="outline">
										Add Order
									</Button>
								</Flex>
							</Flex>

							<VStack align="stretch" gap={3}>
							{orders.map((o, idx) => (
								<OrderRow
									key={o.tempId}
									isAlone={orders.length <= 1}
									idx={idx}
									type={o.type}
									quantity={o.quantity}
									price={o.price}
									date={o.date.getTime()}
									destroy={() => destroyOrder(o.tempId)}
									onUpdate={(p) => updateOrder(trade.tempId, o.tempId, p)}
								/>
							))}
							</VStack>
						</Box>
					</DialogBody>

					<DialogFooter>
						<Button variant="outline" onClick={() => closeDialog(false)}>
							Done
						</Button>
					</DialogFooter>
				</DialogContent>
			</DialogPositioner>
		</DialogRoot>
	);
}