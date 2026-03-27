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

type OrderDate = Date | number;

export interface Order<
	DateType extends OrderDate = number
> {
	quantity: number;
	date: DateType;
	price: number;
	type: OrderEnum;
}

export interface DbOrder<
	DateType extends OrderDate = Date
> extends Order<DateType> {
	id: number;
	tradeId: number;
}

export type OrderUnion<DateType extends OrderDate> =
	Order<DateType> | DbOrder<DateType>;

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

export interface DbTradeEntry<OrderType = DbOrder> extends TradeEntry {
	id: number;
	entryDate: string;
	orders: OrderType[];
}

export interface Trade<
	ChartType extends Chart<Timeframe> | Chart<number> = Chart,
	OrderType extends Order<number> | Order<Date> = Order,
> extends TradeEntry {
	charts: ChartType[];
	orders: OrderType[];
	labels: { id: number; }[];
}

export interface DbTrade<
	ChartType extends Chart<Timeframe> | Chart<number>  = DbChart,
	OrderType extends Order<number> | Order<Date> = DbOrder
> extends TradeEntry {
	id: number;

	symbol: Symbol;
	charts:  ChartType[];
	orders: OrderType[];
	labels: DbLabelEntry[];

	deleted: boolean;
}

export interface TradeScoringData {
	id: number;
	pnl: number;
}

export type ApiTrade = DbTrade<DbChart<Timeframe>, DbOrder<Date>>

export interface LabelEntry {
	name: string;
}

export interface Label extends LabelEntry {
	tradeIds: number[];
}

export interface LabelTrades extends LabelEntry {
	trades: DbTrade[],
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

export type LabelUnion = Label | DbLabelEntry | LabelEntry;

export interface ScoreSet {
	labelIds: number[];
	support: number;
	muIn: number;
	redundancy: number | null;
	profitFactor: number | null;
	upliftPnl: number;
	score: number;
}

export type Level = ScoreSet[];

export interface ApiScoringResponse {
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
	TimeframeType extends ChartTimeframe = number
> {
	timeframe: TimeframeType;
	
	start: number;
	end:   number;

	lines: ChartLine[];
}

export interface DbChart<
	TimeframeType extends ChartTimeframe = number
> extends Chart<TimeframeType> {
	id: number;
	tradeId: number;
	trade?: TradeEntry;
}

export type ChartUnion<TimeframeType extends ChartTimeframe> =
	Chart<TimeframeType> | DbChart<TimeframeType>;