import { useEffect, useState } from "react";

import type { DbJournalChart, DbJournalTrade, JournalChart, JournalEntry } from "../../../shared/journal.types";
import type { Timeframe } from "../../../shared/candles.types";
import type { DbSymbol } from "../../../shared/trades.types";

import type { TempJournalChart } from "./useJournalCharts";
import type { TempJournalTrade } from "./useJournalTrades";

import { createJounrnalEntry, getJournalEntry, updateJournalEntry } from "../api/journal";

const useJournalEntry = (
	charts: TempJournalChart[],
	trades: TempJournalTrade[],
	allSymbols: DbSymbol[],
	setCharts: (charts: DbJournalChart<any, Timeframe>[]) => void,
	setTrades: (trades: DbJournalTrade<any, Timeframe>[]) => void,
	id?: number,
) => {
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");

	const [fromDate, setFromDate] = useState(Date.now());
	const [toDate, setToDate] = useState(Date.now());

	useEffect(() => {
		if (!id) return;

		getJournalEntry(id)
			.then((e) => {

				setTitle(e.title);
				setContent(e.content);

				setFromDate(new Date(e.from).getTime());
				setToDate(new Date(e.to).getTime());

				setCharts(e.charts);
				setTrades(e.trades);

			}).catch(console.error);
	}, [id]);

	const validate = () => {
		if (!title) {
			throw new Error("Title cannot be empty.");
		}

		const from = new Date(fromDate);
		const to = new Date(toDate);

		if (isNaN(from.getTime()) || isNaN(to.getTime())) {
			throw new Error("Invalid from or to dates provided.");
		}

		const symbolExists = new Set<number | null>(allSymbols.map(s => s.id));
		if (charts.some(s => !symbolExists.has(s.symbolId))) {
			throw new Error("Invalid symbol provided in charts.");
		}

		const chartsHaveInvlaidDates = charts.some(s =>
			isNaN(new Date(Number(s.start)).getTime()) ||
			isNaN(new Date(Number(s.end)).getTime())
		);

		if (chartsHaveInvlaidDates) {
			throw new Error("Invalid provided provided in charts.");
		}

		const entry: JournalEntry<Date, Timeframe> = {
			title,
			content,

			from,
			to,

			charts: charts as JournalChart<Timeframe>[],
			trades,
		};

		return entry;
	};

	const submitNewEntry = async () => {
		let entry: JournalEntry<Date, Timeframe>;
		try {
			entry = validate();
		} catch (err: any) {
			console.error(err);
			return setFormError(err.message);
		}

		setSubmitting(true);
		setFormError(null);

		try {
			await createJounrnalEntry(entry);
		} catch (err: any) {
			console.error(err);
			setFormError(err?.message ?? "Failed to create trade");
		} finally {
			setSubmitting(false);
		}
	};

	const submitUpdate = async () => {
		if (!id) return;

		let entry: JournalEntry<Date, Timeframe>;
		try {
			entry = validate();
		} catch (err: any) {
			console.error(err);
			return setFormError(err.message);
		}

		setSubmitting(true);
		setFormError(null);

		try {
			await updateJournalEntry(id, entry);
		} catch (err: any) {
			console.error(err);
			setFormError(err?.message ?? "Failed to create trade");
		} finally {
			setSubmitting(false);
		}
	};

	return {
		formError,
		submitting,

		title,
		setTitle,

		content,
		setContent,

		fromDate,
		setFromDate,

		toDate,
		setToDate,

		submitNewEntry,
		submitUpdate,
	} as const;
};

export default useJournalEntry;