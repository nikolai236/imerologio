import {
	Box,
	Button,
	Flex,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import useSingleEditor from "../hooks/useSingleEditor";
import type { LabelWithId } from "../../../shared/trades.types";
import useEditTrade from "../hooks/useEditTrade";
import useFetchSymbols from "../hooks/useFetchSymbols";
import useFetchLabels from "../hooks/useFetchLabels";
import SelectLabels from "./SelectLabels";
import DescriptionEditor from "./DescriptionEditor";
import SelectLabelButton from "./SelectLabelButton";
import Charts from "./Charts";
import SymbolSelect from "./SymbolSelect";
import StopInput from "./StopInput";
import TargetInput from "./TargetInput";
import Orders from "./Orders";
import { useParams } from "react-router-dom";

const Sections = {
	symbol: "symbol",
	stop: "stop",
	target: "target",
	labels: "labels",
	orders: "orders",
	description: "description",
	charts: "charts",
} as const;

export default function TradePage() {
	const { id: tradeId } = useParams();
	const { labels, loadingLabels   } = useFetchLabels();
	const { symbols, loadingSymbols } = useFetchSymbols();

	const {
		formError,
		submitting,

		symbolId,
		isSupported,
		stop,
		target,
		description,
		charts,
		orders,
		orderSum,

		setStop,
		setTarget,
		setDescription,
		setSymbolId,

		addChart,
		removeChart,
		updateChart,

		updateOrder,
		addOrder,
		removeOrder,

		submitTradeEdit,
	} = useEditTrade(Number(tradeId));

	const { isActive, setActive, lockAll } = useSingleEditor();

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
				{/* Top row: Symbol / Stop / Target */}
				<Flex gap={4} wrap="wrap" align="flex-end">
					<SymbolSelect
						symbols={symbols}
						loading={loadingSymbols}
						symbolId={symbolId}
						handleEditClick={setActive(Sections.symbol)}
						disabled={!isActive(Sections.symbol)}
						setSymbolId={setSymbolId} />

					<StopInput
						stop={stop}
						setStop={setStop}
						handleEditClick={setActive(Sections.stop)}
						disabled={!isActive(Sections.stop)} />

					<TargetInput
						target={target}
						setTarget={setTarget} 
						handleEditClick={setActive(Sections.target)}
						disabled={!isActive(Sections.target)} />

				</Flex>

				<SelectLabelButton
					selectedIds={selectedLabelIds}
					selected={selectedLabels}
					loading={loadingLabels}
					handleEditClick={setActive(Sections.labels)}
					disabled={!isActive(Sections.labels)}
					setOpen={setLabelsOpen}
					setLabelIds={setSelectedLabelIds} />

				<Box borderBottomWidth="1px" />

				<Orders
					removeOrder={removeOrder}
					addOrder={addOrder}
					orders={orders}
					orderSum={orderSum}
					handleEditClick={setActive(Sections.orders)}
					disabled={!isActive(Sections.orders)}
					updateOrder={updateOrder} />

				<Box borderBottomWidth="1px" />

				<DescriptionEditor
					valueHtml={description}
					onChangeHtml={setDescription}
					placeholder="Write your trade notes…"
					handleEditClick={setActive(Sections.description)}
					disabled={!isActive(Sections.description)}
					/>

				<Box borderBottomWidth="1px" />

				<Charts
					updateChart={updateChart}
					removeChart={removeChart}
					addChart={addChart}
					
					handleEditClick={setActive(Sections.charts)}
					disabled={!isActive(Sections.charts)}

					disabledForEdits={!isSupported}
					charts={charts}
					symbols={symbols}
					symbolId={symbolId} />

				<Box borderBottomWidth="1px" />

				<Flex justify="flex-end" gap={3}>
					<Button variant="outline" onClick={lockAll}>
						Cancel
					</Button>
					<Button onClick={submitTradeEdit} loading={submitting} disabled={submitting}>
						Submit Change
					</Button>
				</Flex>
			</VStack>

			<SelectLabels
				labels={labels}
				open={labelsOpen}
				selectedIds={selectedLabelIds}
				setSelectedIds={setSelectedLabelIds}
				setOpen={setLabelsOpen} />

		</Box>
	);
}