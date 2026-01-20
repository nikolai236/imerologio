import { Type } from "@sinclair/typebox";
import { Timeframes } from "../../../shared/candles.types";
import { OrderTypeValues, SymbolTypeValues } from "../../../shared/trades.types";
import { FolderColorsValue } from "../../../shared/news.types";

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
	tradeIds: Type.Optional(Type.Array(Type.Integer())),

	tradesCount: Type.Optional(Type.Integer()),

}, { additionalProperties: false });

export const Labels = Type.Array(Label);

export const SymbolEnum = Type.Union(
	SymbolTypeValues.map(v => Type.Literal(v))
);

export const Symbol = Type.Object({
	id: Type.Optional(Type.Integer()),
	name: Type.String(),
	type: SymbolEnum,
	description: Type.String(),
}, { additionalProperties: false });

export const Symbols = Type.Array(Symbol);

export const OrderEnum = Type.Union(
	OrderTypeValues.map(v => Type.Literal(v))
);

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

	date: Type.Integer(),
	type: OrderEnum,
	tradeId: Type.Optional(Type.Integer()),

}, { additionalProperties: false });

export const Trade = Type.Object({
	id: Type.Optional(Type.Integer()),
	symbolId: Type.Integer(),
	
	target: Type.Optional(Type.Number()),
	stop: Type.Number(),
	
	pnl: Type.Optional(Type.Number()),
	description: Type.String(),

	symbol: Type.Optional(Symbol),
	labels: Labels,

	orders: Type.Array(Order, {
		minItems: 2,
	}),
	charts: Type.Array(Chart),

}, { additionalProperties: false });

export const FolderColorEnum = Type.Union(
	FolderColorsValue.map(v => Type.Literal(v))
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