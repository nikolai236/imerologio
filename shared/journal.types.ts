import type { ChartTimeframe, DbLabel, DbSymbol, OrderEnum } from "./trades.types";

export interface JournalEntry<
	DateType extends string | Date,
	TimeframeType extends ChartTimeframe,
> {
	title: string;

	from: DateType;
	to: DateType;

	content: string;

	trades?: JournalTrade<DateType>[];
	charts?: JournalChart<TimeframeType>[];
}

export interface DbJournalEntry<
	DateType extends string | Date,
	TimeframeType extends ChartTimeframe,
> extends JournalEntry<DateType, TimeframeType> {
	id: number;

	trades: DbJournalTrade<DateType, TimeframeType>[];
	charts: DbJournalChart<DateType, TimeframeType>[];

	createdAt: Date;
	updatedAt: Date;
}

export interface UpdateJournalEntry<
	DateType extends string | Date,
	TimeframeType extends ChartTimeframe,
> extends Partial<
	Omit<
		JournalEntry<DateType, TimeframeType>,
		"trades" | "charts"
	>
> {
	trades?: (
		UpdateJournalTrade<DateType>
		| JournalTrade<DateType>
	)[];
	charts?: (
		UpdateJournalChart<TimeframeType>
		| JournalChart<TimeframeType>
	)[];
}

export interface JournalChart<
	TimeframeType extends ChartTimeframe,
> {
	timeframe: TimeframeType;

	start: number | bigint;
	end:   number | bigint;

	objects: any;
	symbolId: number;

	createdAt: Date;
}

export interface DbJournalChart<
	DateType extends string | Date,
	TimeframeType extends ChartTimeframe,
> extends JournalChart<TimeframeType> {
	id: number;

	journalEntryId: number;
	journalEntry?: DbJournalEntry<DateType, TimeframeType>;

	symbol?: DbSymbol;
}

export interface UpdateJournalChart<
	TimeframeType extends ChartTimeframe,
> extends Partial<
	JournalChart<TimeframeType>
> {
	id?: number;
}

export interface JournalTrade<
	DateType extends string | Date
> {
	target: number;
	stop: number;
	pnl: number;

	symbolId: number;
	orders: JournalOrder<DateType>[];
	labels: (DbLabel | { id: number })[];
}

export interface DbJournalTrade<
	DateType extends string | Date,
	TimeframeType extends ChartTimeframe,
> extends JournalTrade<DateType> {
	id: number;

	orders: DbJournalOrder<DateType>[];

	journalEntryId: number;
	journalEntry?: DbJournalEntry<DateType, TimeframeType>;

	symbol?: DbSymbol;
}

export interface UpdateJournalTrade<
	DateType extends string | Date,
> extends Partial<
	Omit<
		JournalTrade<DateType>,
		"orders"
	>
> {
	id?: number;
	orders?: (
		UpdateJournalOrder<DateType>
		| JournalOrder<DateType>
	)[];
}

export interface JournalOrder<
	DateType extends string | Date
> {
	quantity: number;
	date: DateType;
	price: number;
	type: OrderEnum;
}

export interface DbJournalOrder<
	DateType extends string | Date
> extends JournalOrder<DateType> {
	id: number;
	tradeId: number;
}

export interface UpdateJournalOrder<
	DateType extends string | Date,
> extends Partial<
	JournalOrder<DateType>
> {
	id?: number;
}