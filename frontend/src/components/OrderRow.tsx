import { Box, Text, NativeSelect, Flex, Input, Button } from "@chakra-ui/react";
import DatePicker from "./DatePicker";
import type { Order, OrderEnum } from "../../../shared/trades.types";
import useDraft from "../hooks/useDraft";

type Props = {
	isAlone: boolean;
	idx: number;
	disabled?: boolean;

	price: number,
	date: number;
	type: OrderEnum;
	quantity: number;

	destroy:  () => void;
	onUpdate: (payload: Partial<Order<number>>) => void;
};

export default function OrderRow({
	isAlone,
	idx,
	disabled = false,

	type,
	price,
	date,
	quantity,

	onUpdate,
	destroy
}: Props) {
	const [draftQuantity, setDraftQuantity] = useDraft(quantity);
	const [draftPrice, setDraftPrice] = useDraft(price);

	const commitPrice    = () => onUpdate({ price: Number(draftPrice) });
	const commitQunatity = () => onUpdate({ quantity: Number(draftQuantity) });

	return (
		<Box borderWidth="1px" borderRadius="md" p={3}>
			<Flex gap={3} wrap="wrap" align="flex-end">
				<Box minW="120px">
					<Text fontSize="sm" color="fg.muted" mb={1}>
						Type
					</Text>
					<NativeSelect.Root disabled={disabled}>
						<NativeSelect.Field
							value={type}
							onChange={(e) => onUpdate({
								type: e.target.value as OrderEnum
							})}
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
					disabled={disabled}
					value={draftQuantity}
					onBlur={commitQunatity}
					onChange={e => setDraftQuantity(e.target.value)}
					placeholder="int > 0"
				/>
				</Box>

				<Box minW="170px">
					<Text fontSize="sm" color="fg.muted" mb={1}>
						Price
					</Text>
				<Input
					disabled={disabled}
					value={draftPrice}
					onChange={e => setDraftPrice(e.target.value)}
					onBlur={commitPrice}
					placeholder="e.g. 19280.50"
				/>
				</Box>

				<Box minW="240px" flex="1">
					<DatePicker
						disabled={disabled}
						epoch={date ? Number(date) : undefined}
						onChangeEpoch={(date) => date && onUpdate({ date })}
					/>
				</Box>

				<Button
					colorScheme="red"
					variant="outline"
					onClick={destroy}
					disabled={disabled}
					title={isAlone ? "Must have at least one order" : ""}
				> Remove </Button>

				<Text fontSize="xs" color="fg.muted" ml="auto">
					Order #{idx + 1}
				</Text>
			</Flex>
		</Box>
	);
}