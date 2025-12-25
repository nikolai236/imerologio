import { Box, Flex, NativeSelect, VStack, Text, Input, Button } from '@chakra-ui/react'
import type { Order, OrderEnum } from '../../../shared/trades.types';
import type { TempOrder } from '../hooks/useTradeOrders';

type Props = {
	updateOrder: (id: string, payload: Partial<Order>) => void;
	addOrder: () => void,
	removeOrder: (id: string) => void;
	orderSum: number;
	orders: TempOrder[];
};

export default function Orders({
	updateOrder,
	addOrder,
	removeOrder,
	orders,
	orderSum,
}: Props) {
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
				<Button onClick={addOrder} variant="outline">
				Add Order
				</Button>
			</Flex>

			<VStack align="stretch" gap={3}>
			{orders.map((o, idx) => (
				<Box key={o.tempId} borderWidth="1px" borderRadius="md" p={3}>
					<Flex gap={3} wrap="wrap" align="flex-end">
						<Box minW="120px">
							<Text fontSize="sm" color="fg.muted" mb={1}>
								Type
							</Text>
							<NativeSelect.Root>
								<NativeSelect.Field
									value={o.type}
									onChange={(e) =>
										updateOrder(o.tempId, { type: e.target.value as OrderEnum })
									}
								>
									<option value="BUY">BUY</option>
									<option value="SELL">SELL</option>
								</NativeSelect.Field>
							</NativeSelect.Root>
						</Box>

						<Box minW="140px">
							<Text fontSize="sm" color="fg.muted" mb={1}>
								Quantity
							</Text>
						<Input
							value={o.quantity}
							onChange={(e) => updateOrder(o.tempId, { quantity: Number(e.target.value) })}
							placeholder="int > 0"
						/>
						</Box>

						<Box minW="170px">
							<Text fontSize="sm" color="fg.muted" mb={1}>
								Price
							</Text>
						<Input
							value={o.price}
							onChange={(e) => updateOrder(o.tempId, { price: Number(e.target.value) })}
							placeholder="e.g. 19280.50"
						/>
						</Box>

						<Box minW="240px" flex="1">
						<Text fontSize="sm" color="fg.muted" mb={1}>
							Date/Time
						</Text>
						<Input
							type="datetime-local"
							value={o.date.toString()}
							onChange={(e) => updateOrder(o.tempId, { date: new Date(e.target.value) })}
						/>
						</Box>

						<Button
							colorScheme="red"
							variant="outline"
							onClick={() => removeOrder(o.tempId)}
							disabled={orders.length <= 1}
							title={orders.length <= 1 ? "Must have at least one order" : ""}
						> Remove </Button>

						<Text fontSize="xs" color="fg.muted" ml="auto">
							Order #{idx + 1}
						</Text>
					</Flex>
				</Box>
				))}
			</VStack>
		</Box>);
}