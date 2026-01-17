import { Type } from "@sinclair/typebox";
import { ErrorMessage, IdParams, Symbol, Symbols } from "./common";

export const getSymbolsSchema = {
	schema: {
		response: {
			200: Type.Object({
				symbols: Symbols,
			}, { additionalProperties: false }),
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const getSymbolSchema = {
	schema: {
		params: IdParams,
		response: {
			200: Type.Object({
				symbol: Symbol,
			}, { additionalProperties: false }),
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const postSymbolSchema = {
	schema: {
		body: Type.Omit(Symbol, ["id"]),
		response: {
			201: Type.Object({
				symbol: Symbol,
			}, { additionalProperties: false }),
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const patchSymbolSchema = {
	schema: {
		body: Type.Partial(Type.Omit(Symbol, ["id"])),
		response: {
			200: Type.Object({
				symbol: Symbol,
			}, { additionalProperties: false }),
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const deleteSymbolSchema = {
	schema: {
		params: IdParams,
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