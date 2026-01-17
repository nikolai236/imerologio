import useApi from "./useApi";
import type { DateString, EntryCalendar } from "../../../shared/news.types";

const useNews = () => {
	const api = useApi();
	const path = "/news";

	const getEntryCalendarForDate = async (date: DateString) => {
		const calendar: EntryCalendar  = await api.get(path + "/entry-calendar", { date });
		return calendar;
	};

	return { getEntryCalendarForDate };
};

export default useNews;