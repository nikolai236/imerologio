import type { DateString, EntryCalendar } from "../../../shared/news.types";

import api from "./api";

const path = "/news";

export async function getEntryCalendarForDate(date: DateString) {
	const calendar: EntryCalendar = await api.get(
		path + "/entry-calendar", { date }
	);

	return calendar;
};