import { useEffect, useState } from "react";

import type { EntryCalendar } from "../../../shared/news.types";
import type { TempOrder } from "./useTradeOrders";
import { getEntryCalendarForDate } from "../api/news";

const useEntryCalendar = (orders: TempOrder[]) => {
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
			.then((c) => {
				setCalendar(c);
				setError(null);
			})
			.catch((e) => {
				console.error(e);
				setError(e.message);
			})
			.finally(() => setLoading(false));
	}, [orders]);

	return { calendar, error, loading };
};

export default useEntryCalendar;