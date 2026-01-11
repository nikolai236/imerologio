import { Timeframe } from "./candles.types";

export type OrderEnum  = 'BUY' | 'SELL';
export type SymbolEnum = 'CFD' | 'Futures';

export interface Order {
	quantity: number;
	date: number;
	price: number;
	type: OrderEnum;
}

export interface OrderWithTradeId extends Order {
	tradeId: number;
}

export interface OrderWithId extends OrderWithTradeId {
	id: number;
}

export interface Symbol {
	name: string;
	type: SymbolEnum;
}

export interface UpdateSymbol extends Partial<Symbol>{}

export interface SymbolWithId extends Symbol {
	id: number;
}

export interface Trade {
	description: string,
	pnl?: number;

	target?: number;
	stop: number;
}

export interface TradeWithOrders<
	ChartType=ChartWithTradeId,
	OrderType=Order
> extends Trade {
	symbolId: number;

	charts: ChartType[];
	orders: OrderType[];

	labels: { id: number; }[];
}

export interface TradeFull<C=ChartWithTradeId, O=Order> extends TradeWithOrders<C, O> {
	symbol: Symbol;
}

export interface TradeWithId<C=ChartWithTradeId, O=Order> extends Omit<TradeWithOrders<C,O>, 'orders'|'charts'|'labels'> {
	id: number;
	entryDate?: Date;
	orders: OrderWithId[];
}

export interface TradeFullWithId<C=ChartWithId, O=Order> extends TradeWithId<C,O> {
	symbol: SymbolWithId;

	labels: LabelWithId[];
	charts: C[];
}

export interface Label {
	name: string;
}

export interface LabelWithTradeIds extends Label {
	tradeIds: number[];
}

export interface UpdateLabel extends Partial<Label> {
	tradeId?: number;
}

export interface LabelWithId extends Label {
	id: number;
	tradesCount?: number;
}


export interface Chart<T extends number|Timeframe = number> {
	timeframe: T;

	start: number;
	end:   number;
}

export interface ChartWithTradeId<T extends number|Timeframe = number> extends Chart<T> {
	tradeId: number;
}

export interface ChartWithId<T extends number|Timeframe = number> extends ChartWithTradeId<T> {
	id: number;
	trade?: Trade;
}