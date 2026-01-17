import { useState } from "react";
import {
	Box,
	Button,
	Flex,
	Text,
	VStack,
} from "@chakra-ui/react";

import useFetchLabels from "../hooks/useFetchLabels";
import useFetchSymbols from "../hooks/useFetchSymbols";
import useTradeContext from "../hooks/useTradeContext";

import Orders from "./Orders";
import SelectLabels from "./SelectLabels";
import DescriptionEditor from "./DescriptionEditor";
import SelectLabelButton from "./SelectLabelButton";
import Charts from "./Charts";
import SymbolSelect from "./SymbolSelect";
import StopInput from "./StopInput";
import TargetInput from "./TargetInput";
import EntryCalendar from "./EntryCalendar";

export default function CreateTradePage() {
	const { labels, loadingLabels   } = useFetchLabels();
	const { symbols, loadingSymbols } = useFetchSymbols();

	const {
		formError,
		submitting,
		submitNewTrade,
	} = useTradeContext();

	const [labelsOpen, setLabelsOpen] = useState(false);

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

					<SymbolSelect symbols={symbols} loading={loadingSymbols} />
					<StopInput />
					<TargetInput />

				</Flex>

				<SelectLabelButton
					labels={labels}
					loading={loadingLabels}
					setOpen={setLabelsOpen}
				/>

				<Box borderBottomWidth="1px" />

				<Orders />

				<Box borderBottomWidth="1px" />

				<EntryCalendar />

				<Box>
					<Text fontSize="sm" color="fg.muted" mb={2}>
						Description
					</Text>

					<DescriptionEditor placeholder="Write your trade notes…" />

					<Text fontSize="xs" color="fg.muted" mt={2}>
						Saves HTML to your description field.
					</Text>
				</Box>

				<Box borderBottomWidth="1px" />

				<Charts symbols={symbols} />

				<Box borderBottomWidth="1px" />

				<Flex justify="flex-end" gap={3}>
					<Button variant="outline" onClick={() => window.history.back()}>
						Cancel
					</Button>
					<Button onClick={submitNewTrade} loading={submitting} disabled={submitting}>
						Create Trade
					</Button>
				</Flex>
			</VStack>

			<SelectLabels
				labels={labels}
				open={labelsOpen}
				setOpen={setLabelsOpen} />
		</Box>
	);
}
