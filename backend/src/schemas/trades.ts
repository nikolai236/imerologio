import { Type } from "@sinclair/typebox";
import { ErrorMessage, IdParams, Trade, Trades } from "./common";

export const getTradesSchema = {
	schema: {
		response: {
			200: Type.Object({
				trades: Trades
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

export const postTradeSchema = {
	schema: {
		body: Type.Omit(Trade, ["id", "symbol"]),
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
		body: Type.Partial(
			Type.Omit(Trade, ["id", "symbol"])
		),
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