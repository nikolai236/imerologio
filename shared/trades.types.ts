import type { Timeframe } from "./candles.types";

export const SymbolTypeValues = [
	"Forex",
	"Futures",
	"ETF",
	"Crypto",
	"Stock",
	"Security",
	"Commodity",
] as const;

export const OrderTypeValues = [
	"BUY",
	"SELL"
] as const;

export type OrderEnum  = typeof OrderTypeValues[number];
export type SymbolEnum = typeof SymbolTypeValues[number];

export interface Order<
	DateType extends Date | number
> {
	quantity: number;
	date: DateType;
	price: number;
	type: OrderEnum;
}

export interface DbOrder<
	DateType extends Date | number
> extends Order<DateType> {
	id: number;
	tradeId: number;
}

export interface UpdateOrder<
	DateType extends Date | number
> extends Partial<Order<DateType>>{}

export interface Symbol {
	name: string;
	type: SymbolEnum;
	description: string;
}

export interface UpdateSymbol extends Partial<Symbol>{}

export interface DbSymbol extends Symbol {
	id: number;
}

export interface TradeEntry {
	symbolId: number;
	description: string,
	pnl?: number;

	target?: number;
	stop: number;
}

export interface DbTradeEntry<
	DateType extends Date | number
> extends TradeEntry {
	id: number;
	entryDate: string;
	orders: DbOrder<DateType>[];
}

export interface Trade<
	TimeframeType extends Timeframe | number,
	DateType extends number | Date,
> extends TradeEntry {
	charts: Chart<TimeframeType>[];
	orders: Order<DateType>[];
	labels: { id: number; }[];
}

export interface DbTrade<
	TimeframeType extends Timeframe | number,
	DateType extends number | Date,
> extends TradeEntry {
	id: number;

	symbol: Symbol;
	labels: DbLabelEntry[];

	charts: DbChart<TimeframeType>[];
	orders: DbOrder<DateType>[];

	deleted: boolean;
}

export interface UpdateTrade<
	TimeframeType extends ChartTimeframe,
	DateType extends number | Date,
> extends Partial<
	Omit<
		Trade<TimeframeType, DateType>,
		"charts" | "orders"
	>
> {
	charts: (
		UpdateChart<TimeframeType>
		| Chart<TimeframeType>
	)[];
	orders: (
		UpdateOrder<DateType>
		| Order<DateType>
	)[];
}

export interface TradeScoringData {
	id: number;
	pnl: number;
	risk: number;
}

export type ApiTrade = DbTrade<Timeframe, number>

export interface LabelEntry {
	name: string;
}

export interface Label extends LabelEntry {
	tradeIds: number[];
}

export interface UpdateLabel extends Partial<Label> {
	tradeId?: number;
}

export interface DbLabelEntry extends LabelEntry {
	id: number;
	tradeCount?: number;
}

export interface DbLabel extends Label {
	id: number;
}

export interface PerformanceReport {
	profitFactor: number | null;
	winRate: number;
	trades: ApiTrade[];
}

export interface ScoreSet {
	winRate: number;
	labelIds: number[];
	support: number;
	muIn: number;
	redundancy: number | null;
	profitFactor: number | null;
	totalPnl: number;
	score: number;
}

export type Level = ScoreSet[];

export interface ApiScoringResponse {
	total: number;
	winRate: number;
	mean: number;
	tradeCount: number;
	levels: Level[];
	profitFactor: number | null;
	minSupport: number;
}

export type ChartTimeframe = number | Timeframe;

export type ChartPoint = {
	time: number;
	price: number;
};

export type ChartLine = [ChartPoint, ChartPoint];

export interface Chart<
	TimeframeType extends number | Timeframe
> {
	timeframe: TimeframeType;
	start: number;
	end:   number;
	lines: ChartLine[];
	createdAt: Date;
}

export interface UpdateChart<
	TimeframeType extends number | Timeframe
> extends Partial<Chart<TimeframeType>> {}

export interface DbChart<
	TimeframeType extends number | Timeframe
> extends Chart<TimeframeType> {
	id: number;
	tradeId: number;
	trade?: TradeEntry;
}