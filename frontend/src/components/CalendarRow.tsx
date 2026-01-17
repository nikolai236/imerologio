import { Badge, Flex, HStack, Text } from "@chakra-ui/react";
import { getUTCDateString, getDateForET } from "../lib/timezones";
import type { DateString, FolderColor, NewsEventWithId } from "../../../shared/news.types";

const impactColorMap: Record<FolderColor, string> = {
	Grey: "gray",
	Red: "red",
	Orange: "orange",
	Yellow: "Yellow",
} as const;

function ImpactBadge({ impact }: { impact: FolderColor }) {
	const label = impact.toUpperCase();
	return (
		<Badge
			variant="subtle"
			colorPalette={impactColorMap[impact]}
		> {label}
		</Badge>
	);
}

export default function CalendarRow({
	newsEvent
}: { newsEvent: NewsEventWithId<Date | DateString> }) {
	const { allDay, date: d } = newsEvent;
	const date = new Date(d);

	return (
		<Flex justify="space-between" gap={3} align="center" w="100%">
			<HStack gap={2} flex="1" minW={0}>

				<Text
					fontSize="sm"
					whiteSpace="nowrap"
				> {allDay ? `${getUTCDateString(date)}, All day` : getDateForET(date)}
				</Text>

				{newsEvent.currencies.length > 0 ?
					<Badge variant="outline">{newsEvent.currencies[0]}</Badge> : null
				}

				<ImpactBadge impact={newsEvent.folderColor} />

				<Text
					fontSize="sm" lineClamp={1}
				>{newsEvent.name}</Text>

			</HStack>
		</Flex>
	);
}