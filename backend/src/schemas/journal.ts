import { Type } from "@sinclair/typebox";
import {
	DateString,
	ErrorMessage,
	IdParams,
	OrderEnum,
	TimeframeEnum
} from "./common";

const JournalOrder = Type.Object({
	quantity: Type.Integer(),
	date: DateString,
	price: Type.Number(),
	type: OrderEnum,
});

const DbJournalOrder = Type.Composite([
	JournalOrder,
	Type.Object({
		id: Type.Integer(),
		tradeId: Type.Integer(),
	})
]);

const UpdateJournalOrder = Type.Composite([
	Type.Partial(JournalOrder),
	Type.Object({
		id: Type.Integer(),
	}),
]);

const JournalTrade = Type.Object({
	target: Type.Number(),
	stop: Type.Number(),
	pnl: Type.Number(),
	symbolId: Type.Integer(),
	orders: Type.Array(JournalOrder, {
		minItems: 2,
	}),
});

const DbJournalTrade = Type.Composite([
	Type.Omit(JournalTrade, ["orders"]),
	Type.Object({
		id: Type.Integer(),
		orders: Type.Array(DbJournalOrder),
	})
]);

const UpdateJournalTrade = Type.Composite([
	Type.Partial(
		Type.Omit(JournalTrade, ["orders"]),
	),
	Type.Object({
		id: Type.Integer(),
		orders: Type.Optional(Type.Array(Type.Union([
			JournalOrder,
			UpdateJournalOrder,
		]))),
	}),
]);

const JournalChart = Type.Object({
	timeframe: TimeframeEnum,
	start: Type.Integer(),
	end: Type.Integer(),
	objects: Type.Any(),
	symbolId: Type.Integer(),
});

const DbJournalChart = Type.Composite([
	JournalChart,
	Type.Object({
		id: Type.Integer(),
	})
]);

const UpdateJournalChart = Type.Composite([
	Type.Partial(JournalChart),
	Type.Object({
		id: Type.Integer(),
	}),
]);

const JournalEntry = Type.Object({
	title: DateString,
	from: DateString,
	to: DateString,
	content: Type.String(),
	trades: Type.Array(JournalTrade),
	charts: Type.Array(JournalChart),
});

const DbJournalEntry = Type.Composite([
	Type.Omit(JournalEntry, ["trades", "charts"]),
	Type.Object({
		id: Type.Integer(),

		trades: Type.Array(DbJournalTrade),
		charts: Type.Array(DbJournalChart),

		createdAt: DateString,
		updatedAt: DateString,
	})
])

const UpdateJournalEntry = Type.Composite([
	Type.Partial(
		Type.Omit(JournalEntry, ["trades", "id", "charts"]),
	),
	Type.Object({
		trades: Type.Optional(Type.Array(Type.Union([
			JournalTrade, UpdateJournalTrade
		]))),
		charts: Type.Optional(Type.Array(Type.Union([
			JournalChart, UpdateJournalChart,
		]))),
	}),
]);

const DbJournalEntries = Type.Array(DbJournalEntry);

export const getJournalEntriesSchema = {
	schema: {
		response: {
			200: DbJournalEntries,
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const getJournalEntrySchema = {
	schema: {
		params: IdParams,
		response: {
			200: DbJournalEntry,
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const postJournalEntrySchema = {
	schema: {
		body: JournalEntry,
		response: {
			200: DbJournalEntry,
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const patchJournalEntrySchema = {
	schema: {
		params: IdParams,
		body: UpdateJournalEntry,
		response: {
			200: DbJournalEntry,
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;