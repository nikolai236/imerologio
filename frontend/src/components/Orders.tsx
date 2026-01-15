import { Box, Flex, VStack, Text, Button } from '@chakra-ui/react'
import EditButton from './EditButton';
import useTradeContext from '../hooks/useTradeContext';
import OrderRow from './OrderRow';

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

		updateOrder,
		addOrder,
		removeOrder
	} = useTradeContext();

	return (
		<Box>
			<Flex align="center" justify="space-between" wrap="wrap" gap={3} mb={3}>
				<Box>
					<Text fontSize="sm" color="fg.muted">
						Orders
					</Text>
					<Text fontSize="xs" color={orderSum === 0 ? "fg.muted" : "red.400"}>
						Net quantity must be 0. Current: {orderSum}
					</Text>
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