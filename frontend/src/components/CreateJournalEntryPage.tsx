
import {
	Box,
	Button,
	Flex,
	Text,
	VStack,
} from "@chakra-ui/react";

import DescriptionEditor from "./DescriptionEditor";
import JournalCharts from "./JournalCharts";
import useFetchSymbols from "../hooks/useFetchSymbols";
import useCreateJournalEntry from "../hooks/useCreateJournalEntry";
import useJournalCharts from "../hooks/useJournalCharts";
import useJournalTrades from "../hooks/useJournalTrades";

export default function CreateJournalEntryPage() {
	const { symbols, loadingSymbols } = useFetchSymbols();

	const { trades, addTrade } = useJournalTrades();
	const {
		charts,
		addChart,
		updateChart,
		removeChart
	} = useJournalCharts();

	const {
		formError,
		submitting,

		title,
		setTitle,

		content,
		setContent,

		fromDate,
		setFromDate,

		toDate,
		setToDate,

		submitNewEntry,
	} = useCreateJournalEntry(charts, symbols);

	return (
		<Box p={6} maxW="1000px" mx="auto">
			<Text fontSize="2xl" fontWeight="bold" mb={4}>
				Create JournalEntry
			</Text>

			{formError ? (
				<Box mb={4} p={3} borderWidth="1px" borderRadius="md">
					<Text color="red.400">{formError}</Text>
				</Box>
			) : null}

			<VStack align="stretch" gap={5}>
				<Box>
					<DescriptionEditor
						description={content}
						setDescription={setContent}
						placeholder="Write your trade notes…"
						name="Content"
					/>

					<Text fontSize="xs" color="fg.muted" mt={2}>
						Saves HTML to your description field.
					</Text>
				</Box>

				<Box borderBottomWidth="1px" />

				<JournalCharts
					addTrade={addTrade}
					trades={trades}
					symbols={symbols}
					parentLoading={loadingSymbols}
				/>

				<Box borderBottomWidth="1px" />

				<Flex justify="flex-end" gap={3}>
					<Button variant="outline" onClick={() => window.history.back()}>
						Cancel
					</Button>
					<Button onClick={submitNewEntry} loading={submitting} disabled={submitting}>
						Create Trade
					</Button>
				</Flex>
			</VStack>
		</Box>
	);
}
