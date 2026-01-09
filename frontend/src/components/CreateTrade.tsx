import { useMemo, useState } from "react";
import {
	Box,
	Button,
	Flex,
	Text,
	VStack,
} from "@chakra-ui/react";
import Orders from "./Orders";
import type { LabelWithId, Order, TradeWithOrders, Chart } from "../../../shared/trades.types";
import SelectLabels from "./SelectLabels";
import DescriptionEditor from "./DescriptionEditor";
import SelectLabelButton from "./SelectLabelButton";
import Charts from "./Charts";
import SymbolSelect from "./SymbolSelect";
import StopInput from "./StopInput";
import TargetInput from "./TargetInput";
import useFetchLabels from "../hooks/useFetchLabels";
import useFetchSymbols from "../hooks/useFetchSymbols";
import useEditTrade from "../hooks/useEditTrade";

export default function CreateTrade() {
	const { labels, loadingLabels   } = useFetchLabels();
	const { symbols, loadingSymbols } = useFetchSymbols();

	const {
		symbolId,
		isSupported,
		formError,
		submitting,

		stop,
		target,
		description,
		charts,
		orders,
		orderSum,

		getEntry,
		getExits,

		setStop,
		setTarget,
		setDescription,

		addChart,
		removeChart,
		updateChart,

		updateOrder,
		addOrder,
		removeOrder,
		setSymbolId,

		submit,
	} = useEditTrade();

	const [labelsOpen, setLabelsOpen] = useState(false);
	const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);

	const selectedLabels = useMemo(
		() => selectedLabelIds
			.map((id) => labels.find((l) => l.id === id))
			.filter(Boolean) as LabelWithId[],
		[selectedLabelIds, labels]
	);

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
				<Flex gap={4} wrap="wrap" align="flex-end">
					<SymbolSelect
						symbols={symbols}
						loading={loadingSymbols}
						symbolId={symbolId}
						setSymbolId={setSymbolId} />

					<StopInput stop={stop} setStop={setStop} />
					<TargetInput target={target} setTarget={setTarget} />

				</Flex>

				<SelectLabelButton
					selectedIds={selectedLabelIds}
					selected={selectedLabels}
					loading={loadingLabels}
					setOpen={setLabelsOpen}
					setLabelIds={setSelectedLabelIds}
				/>

				<Box borderBottomWidth="1px" />

				<Orders
					removeOrder={removeOrder}
					addOrder={addOrder}
					orders={orders}
					orderSum={orderSum}
					updateOrder={updateOrder} />

				<Box borderBottomWidth="1px" />

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

				<Box borderBottomWidth="1px" />

				<Charts
					stop={Number(stop)}
					target={target == '' ? undefined : Number(target)}
					getEntry={getEntry}
					getExits={getExits}
					updateChart={updateChart}
					removeChart={removeChart}
					addChart={addChart}

					disabledForEdits={!isSupported}
					charts={charts}
					symbols={symbols}
					symbolId={symbolId} />
				<Box borderBottomWidth="1px" />

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
				setOpen={setLabelsOpen}
			/>
		</Box>
	);
}
