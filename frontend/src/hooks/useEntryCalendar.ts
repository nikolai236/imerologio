import { useEffect, useState } from "react";
import useNews from "./useNews";

import type { TempOrder } from "./useTradeOrders";
import type { EntryCalendar } from "../../../shared/news.types";

const useEntryCalendar = (orders: TempOrder[]) => {
	const { getEntryCalendarForDate } = useNews();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [calendar, setCalendar] = useState<EntryCalendar|null>(null);

	useEffect(() => {
		if (orders.length == 0) {
			return setCalendar(null);
		}

		const [entry] = orders;
		const date = new Date(entry.date).toISOString();

		setLoading(true);

		getEntryCalendarForDate(date)
			.then(setCalendar)
			.catch((e) => {
				console.error(e);
				setError(e.message);
			})
			.finally(() => setLoading(false));
	}, [orders]);

	return { calendar, error, loading };
};

export default useEntryCalendar;