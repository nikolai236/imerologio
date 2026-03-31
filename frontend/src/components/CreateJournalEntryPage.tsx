
import {
	Box,
	Button,
	Flex,
	HStack,
	Input,
	Text,
	VStack,
} from "@chakra-ui/react";

import DescriptionEditor from "./DescriptionEditor";
import JournalCharts from "./JournalCharts";
import useFetchSymbols from "../hooks/useFetchSymbols";
import useCreateJournalEntry from "../hooks/useCreateJournalEntry";
import useJournalContext from "../hooks/useJournalContext";
import DatePicker from "./DatePicker";

export default function CreateJournalEntryPage() {
	const { symbols, loadingSymbols } = useFetchSymbols();

	const { charts, } = useJournalContext();

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

			<Box minW="220px" flex="1" mb={5}>
				<Text fontSize="sm" color="fg.muted">
					Title
				</Text>
				<Input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Title"
					maxW="360px"
				/>
			</Box>

			<HStack mb={5}>
				<DatePicker
					label="From"
					epoch={fromDate}
					onChangeEpoch={(ms) => ms && setFromDate(ms)}
				/>
				<DatePicker
					label="To"
					epoch={toDate}
					onChangeEpoch={(ms) => ms && setToDate(ms)}
				/>
			</HStack>

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
