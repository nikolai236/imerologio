export type OrderEnum  = 'BUY' | 'SELL';
export type SymbolEnum = 'CFD' | 'Futures';

export interface Order {
	quantity: number;
	date: Date;
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

export interface TradeWithOrders extends Trade {
	symbolId: number;

	charts: Chart[];
	orders: Order[];

	labels: { id: number; }[];
}

export interface TradeFull extends TradeWithOrders {
	symbol: Symbol;
}

export interface TradeWithId extends Omit<TradeWithOrders, 'orders'|'charts'|'labels'> {
	id: number;
	entryDate?: Date;
	orders: OrderWithId[];
}

export interface TradeFullWithId extends TradeWithId {
	symbol: SymbolWithId;

	labels: LabelWithId[];
	charts: ChartWithId[];
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

export interface Chart {
	timeframe: number;

	start: number;
	end:   number;

	tradeId: number;
}

export interface ChartWithId extends Chart {
	id: number;
	trade?: Trade;
}
