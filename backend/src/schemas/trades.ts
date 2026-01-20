import { Type, Static } from "@sinclair/typebox";
import { ErrorMessage, IdParams, Trade } from "./common";

export const getTradesSchema = {
	schema: {
		response: {
			200: Type.Object({
				trades: Type.Array(Type.Omit(
					Trade, ["charts", "labels"]
				))
			}, { additionalProperties: false }),
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const getTradeSchema = {
	schema: {
		params: IdParams,
		response: {
			200: Type.Object({
				trade: Trade
			}, { additionalProperties: false }),
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

const TradeInput = Type.Composite([
	Type.Omit(Trade, ["id", "symbol", "labels"]),
	Type.Object({
		labels: Type.Array(Type.Object({
			id: Type.Integer(),
		})),
	}),
]);

export const postTradeSchema = {
	schema: {
		body: TradeInput,
		response: {
			201: Type.Object({
				trade: Trade
			}, { additionalProperties: false }),
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const patchTradeSchema = {
	schema: {
		body: Type.Partial(TradeInput),
		response: {
			200: Type.Object({
				trade: Trade
			}, { additionalProperties: false }),
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const deleteLabelFromTradeSchema = {
	schema: {
		params: Type.Object({
			tradeId: Type.Integer(),
			labelId: Type.Integer()
		}, { additionalProperties: false }),
		response: {
			200: Type.Object({
				message: Type.String(),
			}, { additionalProperties: false }),
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;