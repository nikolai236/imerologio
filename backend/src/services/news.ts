import type { PrismaClient } from "@prisma/client";
import type { DateString, EntryCalendar, FolderColor } from "../../../shared/news.types";
import newsRepository from "../database/news";

const BANK_HOLIDAY = "Bank Holiday";

const getStartOfDay = (d: Date) => {
	const date = new Date(Date.UTC(
		d.getUTCFullYear(),
		d.getUTCMonth(),
		d.getUTCDate(),
		0, 0, 0, 0,
	));
	return date;
};

const getNextDay = (day: Date) => {
	const nextDay = new Date(day);
	nextDay.setUTCHours(0, 0, 0, 0);
	nextDay.setUTCDate(nextDay.getUTCDate() + 1);
	return nextDay;
};

const getPrevDay = (day: Date) => {
	const prevDay = new Date(day);
	prevDay.setUTCHours(0, 0, 0, 0);
	prevDay.setUTCDate(prevDay.getUTCDate() - 1);
	return prevDay;
};

const getAdjacentDays = (date: Date | DateString) => {
	if (typeof date == "string") date = new Date(date);

	const day = getStartOfDay(date);
	const prevDay = getPrevDay(day);
	const nextDay = getNextDay(day);

	return { prevDay, day, nextDay };
};

export default function newsService(db: PrismaClient) {
	const { getNewsEvents } = newsRepository(db);

	const getNewsEventsForRange = async (start: Date, end: Date) => {
		const from = getPrevDay(start);
		const upTo = getNextDay(getNextDay(end));

		return await getNewsEvents({ from, upTo });
	};

	const getNewsEventsForDate = async (
		date?: Date,
		types?: string[],
		folderColors?: FolderColor[]
	) => {
		let range: { from: Date, upTo: Date } | undefined;
		if (date) {
			const from = getStartOfDay(date);
			const upTo = getNextDay(from);

			range = { from, upTo };
		}
		return await getNewsEvents(range, types, folderColors);
	};

	const getSingleDayCalendar = async (date: Date | DateString): Promise<EntryCalendar> => {
		const { prevDay, day, nextDay } = getAdjacentDays(date);

		const [prev, current, next] = await Promise.all([
			getNewsEventsForDate(prevDay, [BANK_HOLIDAY], ["Grey"]),
			getNewsEventsForDate(day),
			getNewsEventsForDate(nextDay, undefined, ["Red", "Grey"]),
		]);

		return {
			prev,
			current,
			next: next.filter(e =>
				e.name == BANK_HOLIDAY ||
				e.folderColor != "Grey"
			),
		};
	};

	return {
		getNewsEventsForRange,
		getSingleDayCalendar,
		getNewsEventsForDate,
	} as const;
}