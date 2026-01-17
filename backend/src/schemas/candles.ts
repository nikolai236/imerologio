import { Type } from "@sinclair/typebox";
import { ErrorMessage, TimeframeEnum } from "./common";

const Candle = Type.Object({
	open: Type.Number(),
	high: Type.Number(),
	low: Type.Number(),
	close: Type.Number(),

	time: Type.Integer(),
	volume: Type.Number(),
}, { additionalProperties: false });

const Candles = Type.Array(Candle);

export const getSupportedSchema = {
	schema: {
		params: Type.Object({
			symbolId: Type.Integer(),
		}, { additionalProperties: false }),
		response: {
			200: Type.Object({
				message: Type.String()
			}, { additionalProperties: false }),
			405: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const postCandleSymbolSchema = {
	schema: {
		params: Type.Object({
			symbol: Type.String(),
		}, { additionalProperties: false }),
		body: Type.Object({
			timeframe: TimeframeEnum,
			start: Type.Integer(),
			end: Type.Integer(),
		}, { additionalProperties: false }),
		response: {
			200: Type.Object({
				candles: Candles,
			}, { additionalProperties: false }),
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;