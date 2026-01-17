import { Box, Flex, Spinner, Text, VStack } from "@chakra-ui/react";
import useTradeContext from "../hooks/useTradeContext";
import type { DateString, NewsEventWithId } from "../../../shared/news.types";
import CalendarRow from "./CalendarRow";

function EventSection({
	title,
	events
}: { title: string; events: NewsEventWithId<Date | DateString>[] }) {
	if (events.length == 0) return null;

	return (
		<Box>
			<Text fontSize="sm" color="fg.muted" mb={2}>
				{title}
			</Text>
			<VStack align="stretch" gap={2}>
				{events.map((event) => (
					<Box
						key={event.id}
						p={2}
						borderWidth="1px"
						borderRadius="md"
					>
						<CalendarRow newsEvent={event} />
					</Box>
				))}
			</VStack>
		</Box>
	);
}

export default function EntryCalendar() {
	const {
		calendar,
		calendarError: error,
		calendarLoading: loading,
	} = useTradeContext();

	if (calendar == null ||
		Object.keys(calendar).length == 0 ||
		Object.values(calendar).every(v => v.length == 0)
	) {
		return null;
	}

	return (
		<>
			<Box>
				<Flex align="center" justify="space-between" mb={2}>
					<Text fontSize="sm" color="fg.muted">
						Calendar for entry
					</Text>
					{loading ? <Spinner size="sm" /> : null}
				</Flex>

				{error ? (
					<Box p={3} borderWidth="1px" borderRadius="md">
						<Text fontSize="sm" color="red">Error: {error}</Text>
					</Box>
				) : null}

				{calendar ? (
					<VStack align="stretch" gap={4}>
						<EventSection title="Prev day" events={calendar.prev ?? []} />
						<EventSection title="Entry day" events={calendar.current ?? []} />
						<EventSection title="Next day" events={calendar.next ?? []} />
					</VStack>
				) : !loading && !error ? (
					<Box p={3} borderWidth="1px" borderRadius="md">
						<Text fontSize="sm">No news data.</Text>
					</Box>
				) : null}
			</Box>
			<Box borderBottomWidth="1px" />
		</>
	);
}
