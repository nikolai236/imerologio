import { Box, Flex, VStack, Text, Button } from '@chakra-ui/react'
import EditButton from './EditButton';
import useTradeContext from '../hooks/useTradeContext';
import OrderRow from './OrderRow';
import { useMemo } from 'react';
import { Timeframes } from '../../../shared/candles.types';

type Props = {
	disabled?: boolean;
	handleEditClick?: () => void,
};

export default function Orders({
	disabled = false,
	handleEditClick,
}: Props) {
	const {
		orders,
		orderSum,
		target,
		stop,

		getEntryForTf,
		updateOrder,
		addOrder,
		removeOrder
	} = useTradeContext();

	const pnl = useMemo(() => orders.reduce((prev, o) =>
		prev - (o.type == "BUY" ? 1 : -1) * o.quantity * o.price, 0
	), [orders]);

	const entry = useMemo(() =>{
		if (orders.length == 0) return null;

		return getEntryForTf(Timeframes.tf30s);
	}, [getEntryForTf, orders]);

	const risk = useMemo(() => {
		if (stop == null || entry == null) return null;

		const { price: entryPrice, quantity } = entry;
		return (entryPrice - stop) * quantity;

	}, [stop, entry, orders]);

	const RR = useMemo(() => {
		if (orderSum != 0 || risk == null || entry == null) return null;

		const { price: entryPrice, quantity } = entry;

		if (pnl > 0) return pnl / risk;
		if (!target) return null;

		const profit = (target - entryPrice) * quantity;
		return Math.abs(profit / pnl);

	}, [orderSum, risk, entry, pnl, target]);

	return (
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
					<EditButton
						visible={disabled}
						onClick={handleEditClick ?? (()=>{})}
					/>
					<Button onClick={addOrder} variant="outline">
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
					date={o.date}
					destroy={() => removeOrder(o.tempId)}
					onUpdate={(p) => updateOrder(o.tempId, p)}
				/>
			))}
			</VStack>
		</Box>);
}