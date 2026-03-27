import { useState } from "react";

import type { JournalChart, JournalEntry } from "../../../shared/journal.types";
import type { Timeframe } from "../../../shared/candles.types";
import type { DbSymbol } from "../../../shared/trades.types";

import type { TempJournalChart } from "./useJournalCharts";
import { createJounrnalEntry } from "../api/journal";

const useCreateJournalEntry = (charts: TempJournalChart[], allSymbols: DbSymbol[]) => {
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");

	const [fromDate, setFromDate] = useState(Date.now());
	const [toDate, setToDate] = useState(Date.now());

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
			trades: [],
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
	} as const;
};

export default useCreateJournalEntry;