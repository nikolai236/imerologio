import { Type, Static } from "@sinclair/typebox";
import { ErrorMessage, IdParams, Trade } from "./common";

export const getTradesSchema = {
	schema: {
		querystring: Type.Object({
			from: Type.Optional(Type.Integer()),
			to:   Type.Optional(Type.Integer()),
		}),
		response: {
			200: Type.Array(Type.Omit(
				Trade, ["charts", "labels"]
			)),
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const getTradeSchema = {
	schema: {
		params: IdParams,
		response: {
			200: Trade,
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
			201: Trade,
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const patchTradeSchema = {
	schema: {
		params: IdParams,
		body: Type.Partial(TradeInput),
		response: {
			200: Trade,
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const deleteTradeSchema = {
	schema: {
		params: IdParams,
		response: {
			200: Type.Object({
				message: Type.String(),
			}),
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const deleteLabelFromTradeSchema = {
	schema: {
		params: Type.Object({
			id: Type.Integer(),
			labelId: Type.Integer()
		}),
		response: {
			200: Type.Object({
				message: Type.String(),
			}),
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;