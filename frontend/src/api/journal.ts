import type { Timeframe } from "../../../shared/candles.types";
import type { DbJournalEntry, JournalEntry } from "../../../shared/journal.types";

import api from "./api";

const path = "/journal";

export type ApiJournalEntry =
	DbJournalEntry<Date, Timeframe> |
	DbJournalEntry<string, Timeframe>;

const sanitizeDates = (entry: any) => {
	entry.from = new Date(entry.from);
	entry.to = new Date(entry.to);
	return entry;
};

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