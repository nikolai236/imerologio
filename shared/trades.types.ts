import { Timeframe } from "./candles.types";

export type OrderEnum  = 'BUY' | 'SELL';
export type SymbolEnum = 'CFD' | 'Futures';

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
	labels: DbLabel[];
}

export type ApiTrade = DbTrade<DbChart<Timeframe>, DbOrder<Date>>

export interface LabelEntry {
	name: string;
}

export interface Label extends LabelEntry {
	tradeIds: number[];
}

export interface UpdateLabel extends Partial<Label> {
	tradeId?: number;
}

export interface DbLabel extends LabelEntry {
	id: number;
	tradesCount?: number;
}

export type LabelUnion = Label | DbLabel | LabelEntry;

type ChartTimeframe = number | Timeframe;

export interface Chart<
	TimeframeType extends ChartTimeframe = number
> {
	timeframe: TimeframeType;

	start: number;
	end:   number;
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