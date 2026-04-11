import { Box, Flex, Spinner, Text, VStack } from "@chakra-ui/react";
import type { DateString, DbNewsEvent } from "../../../shared/news.types";
import { useEffect, useMemo, useState } from "react";
import { getRangeCalendar } from "../api/news";
import CalendarRow from "./CalendarRow";

type Props = {
	start: number | bigint,
	end: number | bigint,
};

const etDayFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: "America/New_York",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

const useDate = (num: number | bigint) =>
	useMemo(
		() => new Date(Number(num)),
		[num]
	);

const getDayKey = (date: Date) =>
	etDayFormatter.format(date)

function EventSection({
	title,
	events
}: { title: string; events: DbNewsEvent<Date | DateString>[] }) {
	return events.length === 0 ? null : (
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

export default function RangeCalendar({
	start,
	end,
}: Props) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<DbNewsEvent<DateString>[]>([]);

	const startDate = useDate(start)
	const endDate = useDate(end);

	const calendar = useMemo(
		() => data
			.map(({ date, ...row }) => ({
				...row,
				date: new Date(date),
			}))
			.reduce<DbNewsEvent<Date>[][]>((groups, row) => {
				const key = getDayKey(row.date)
				const lastGroup = groups.at(-1);

				if (lastGroup == null || lastGroup.length === 0) {
					groups.push([row]);
					return groups;
				}

				const lastKey = getDayKey(lastGroup[0].date);

				if (key === lastKey) {
					lastGroup.push(row);
				} else {
					groups.push([row]);
				}

				return groups;
			}, []),
		[data]
	);

	useEffect(() => {
		setLoading(true);

		getRangeCalendar(startDate, endDate)
			.then(setData)
			.catch(setError)
			.finally(() => setLoading(false))

	}, [startDate, endDate])

	return (
		<Box>
			<Flex align="center" justify="space-between" mb={2}>
				<Text fontSize="sm" color="fg.muted">
					Calendar
				</Text>
				{loading ? <Spinner size="sm" /> : null}
			</Flex>

			{error ? (
				<Box p={3} borderWidth="1px" borderRadius="md">
					<Text fontSize="sm" color="red">
						Error: {error}
					</Text>
				</Box>
			) : null}

			<VStack align="stretch" gap={4}>
				{calendar.map((group, i) => group.length != 0
					? <EventSection
						key={i}
						title={etDayFormatter.format(group[0].date)}
						events={group}
					/>
					: null
				)}
			</VStack>
		</Box>
	);
}