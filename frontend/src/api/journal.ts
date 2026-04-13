import type { Timeframe } from "../../../shared/candles.types";
import type { DbJournalEntry, JournalEntry, UpdateJournalEntry } from "../../../shared/journal.types";

import api from "./api";

const path = "/journal";

export type ApiJournalEntry =
	DbJournalEntry<Date, Timeframe> |
	DbJournalEntry<string, Timeframe>;

const sanitizeDates = ({ from, to, charts, ...rest }: ApiJournalEntry) => ({
	...rest,
	from: new Date(from),
	to: new Date(to),
	charts: charts.map(({ createdAt, ...rest }) => ({
		...rest,
		createdAt: new Date(createdAt),
	})),
});

export async function getJournalEntries() {
	const data = await api.get(path);
	const entries = data.map(sanitizeDates);
	return entries as ApiJournalEntry[];
}

export async function getJournalEntry(id: number) {
	const entry = await api.get(`${path}/${id}`);
	return sanitizeDates(entry) as ApiJournalEntry;
}

export async function createJounrnalEntry(
	payload: JournalEntry<Date, Timeframe>
) {
	const entry = await api.post(path, payload);
	return sanitizeDates(entry) as ApiJournalEntry;
}

export async function updateJournalEntry(
	id: number,
	payload:  UpdateJournalEntry<Date, Timeframe>
) {
	const entry = await api.patch(`${path}/${id}`, payload);
	return sanitizeDates(entry) as ApiJournalEntry;
}