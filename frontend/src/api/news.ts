import type { DateString, EntryCalendar, NewsEvent, DbNewsEvent } from "../../../shared/news.types";

import api from "./api";

const path = "/news";

export async function getSingleDayCalendar(date: DateString) {
	const calendar: EntryCalendar = await api.get(
		path + "/single-day-calendar", { date }
	);

	return calendar;
};

export async function getRangeCalendar(
	start: Date | DateString,
	end: Date | DateString
) {
	const query = {
		start: new Date(start).toISOString(),
		end: new Date(end).toISOString()
	};

	const calendar: DbNewsEvent<DateString>[] = await api.get(
		`${path}/range`, query
	);

	return calendar;
}