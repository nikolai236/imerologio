import { FolderColor, PrismaClient } from "@prisma/client";
import type { DateString, EntryCalendar } from "../../../shared/news.types";
import useNews from "../database/news";

const BANK_HOLIDAY = "Bank Holiday";

const _getStartOfDay = (d: Date) => {
	const date = new Date(Date.UTC(
		d.getUTCFullYear(),
		d.getUTCMonth(),
		d.getUTCDate(),
		0, 0, 0, 0,
	));
	return date;
};

const _getNextDay = (day: Date) => {
	const nextDay = new Date(day);
	nextDay.setUTCDate(nextDay.getUTCDate() + 1);
	return nextDay;
};

const _getPrevDay = (day: Date) => {
	const prevDay = new Date(day);
	prevDay.setUTCDate(prevDay.getUTCDate() - 1);
	return prevDay;
}

const _getDays = (date: Date | DateString) => {
	if (typeof date == "string") date = new Date(date);

	const day = _getStartOfDay(date);
	const prevDay = _getPrevDay(day);
	const nextDay = _getNextDay(day);

	return { prevDay, day, nextDay };
};

const useNewsService = (db: PrismaClient) => {
	const { getNewsEvents } = useNews(db);

	const getNewsEventsForDate = async (
		date?: Date,
		types?: string[],
		folderColors?: FolderColor[]
	) => {
		let range: { from: Date, upTo: Date } | undefined;
		if (date) {
			const from = _getStartOfDay(date);
			const upTo = _getNextDay(from);

			range = { from, upTo };
		}
		return await getNewsEvents(range, types, folderColors);
	};

	const getEntryCalendar = async (date: Date | DateString): Promise<EntryCalendar> => {
		const { prevDay, day, nextDay } = _getDays(date);

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
		getEntryCalendar,
		getNewsEventsForDate,
	};
};

export default useNewsService;