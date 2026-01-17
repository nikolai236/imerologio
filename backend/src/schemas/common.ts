import { Type } from "@sinclair/typebox";
import { Timeframes } from "../../../shared/candles.types";

export const ErrorMessage = Type.Unsafe({
	$ref: "ErrorMessage#",
} as const);

export const DateString = Type.String({
	format: "date-time"
});

export const IdParams = Type.Object({
	id: Type.Number(),
}, { additionalProperties: false });

export const Label = Type.Object({
	id: Type.Optional(Type.Integer()),
	name: Type.String(),
	tradeId: Type.Optional(Type.Integer()),
	tradeIds:Type.Optional(Type.Array(Type.Integer())),
	tradesCount: Type.Optional(Type.Integer()),
}, { additionalProperties: false });

export const Labels = Type.Array(Label);

export const SymbolEnum = Type.Union(
	["Forex", "Futures", "ETF", "Crypto", "Stock", "Security", "Commodity"]
		.map(v => Type.Literal(v))
);

export const Symbol = Type.Object({
	id: Type.Optional(Type.Integer()),
	name: Type.String(),
	type: SymbolEnum,
	date: Type.Integer(),
	description: Type.String(),
}, { additionalProperties: false });

export const Symbols = Type.Array(Symbol);

export const OrderEnum = Type.Union([
	Type.Literal("BUY"), Type.Literal("SELL")
]);

export const TimeframeEnum = Type.Union(
	Object.values(Timeframes).map(v => Type.Literal(v))
)

export const Chart = Type.Object({
	id: Type.Optional(Type.Integer()),
	tradeId: Type.Optional(Type.Integer()),

	timeframe: TimeframeEnum,
	start: Type.Integer(),
	end: Type.Integer(),
}, { additionalProperties: false });

export const Order = Type.Object({
	id: Type.Optional(Type.Integer()),
	price: Type.Number(),
	quantity: Type.Integer(),
	type: OrderEnum,
	tradeId: Type.Optional(Type.Integer())
}, { additionalProperties: false });

export const Trade = Type.Object({
	id: Type.Optional(Type.Integer()),
	symbolId: Type.Integer(),

	
	target: Type.Optional(Type.Number()),
	stop: Type.Number(),
	
	pnl: Type.Optional(Type.Number()),
	description: Type.String(),

	symbol: Type.Optional(Symbol),
	labels: Type.Optional(Labels),

	orders: Type.Optional(Type.Array(Order)),
	charts: Type.Optional(Type.Array(Chart)),

}, { additionalProperties: false });

export const Trades = Type.Array(Trade);

export const FolderColorEnum = Type.Union(
	["Red", "Orange", "Yellow", "Grey"]
		.map(v => Type.Literal(v))
);

export const NewsEvent = Type.Object({
	id: Type.Optional(Type.Integer()),
	date: DateString,

	name: Type.String(),
	currencies: Type.Array(Type.String()),
	folderColor: FolderColorEnum,

	metdata: Type.Optional(
		Type.Record(Type.String(), Type.Any())
	),
	allDay: Type.Optional(Type.Boolean()),
	source: Type.Optional(Type.String()),

}, { additionalProperties: false });

export const NewsEvents = Type.Array(NewsEvent);