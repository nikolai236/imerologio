import { Type } from "@sinclair/typebox";
import { IdParams, ErrorMessage, Labels, Label, ScoringResponse, NullableNumber, Trade } from "./common";

const PerformanceReport = Type.Object({
	profitFactor: NullableNumber,
	winRate: Type.Number(),
	trades: Type.Array(Trade),
});

export const getLabelsSchema = {
	schema: {
		querystring: Type.Optional(Type.Object({
			symbols: Type.Optional(Type.Boolean()),
		})),
		response: {
			200: Type.Object({
				labels: Labels
			}),
			400: ErrorMessage,
			500: ErrorMessage,
		},
	}
} as const;

export const getLabelPerformance = {
	schema: {
		querystring: Type.Optional(Type.Object({
			includeIds: Type.Optional(Type.String()),
			excludeIds: Type.Optional(Type.String()),
		})),
		resposnse: {
			200: PerformanceReport,
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const getLabelScoringSchema = {
	schema: {
		querystring: Type.Optional(Type.Object({
			filterBe: Type.Optional(Type.Boolean()),
			beThreshold: Type.Optional(Type.Number()),
		})),
		response: {
			200: ScoringResponse,
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const postLabelSchema = {
	schema: {
		body: Type.Omit(
			Label, ["id", "tradeId"]
		),
		response: {
			201: Type.Object({
				label: Label
			}),
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const patchLabelSchema = {
	schema: {
		params: IdParams,
		body: Type.Partial(
			Type.Omit(Label, ["id", "tradeIds"])
		),
		response: {
			200: Type.Object({
				label: Label
			}),
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const deleteLabelSchema = {
	schema: {
		params: IdParams,
		response: {
			200: Type.Object({
				message: Type.String()
			}),
			404: ErrorMessage,
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;