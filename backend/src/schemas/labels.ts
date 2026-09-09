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
			200: Labels,
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

export const getLabelAdjacencyListSchema = {
	schema: {
		params: IdParams,
		response: {
			200: Type.Record(
				Type.Number(),
				Type.Array(Type.Number()),
			),
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

const LabelWithDescendants = Type.Composite([
	Label,
	Type.Object({
		descendants: Type.Array(Label),
	})
]);

export const getLabelWithDescendatsSchema = {
	schema: {
		params: IdParams,
		response: {
			200: LabelWithDescendants,
			404: ErrorMessage,
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
			201: Label,
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

const ChildrenReqParams = Type.Object({
	parentId: Type.Number(),
	childId: Type.Number(),
});

export const addChildSchema = {
	schema: {
		params: ChildrenReqParams,
		response: {
			201: LabelWithDescendants,
			400: ErrorMessage,
			404: ErrorMessage,
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
			200: Label,
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const removeChildSchema = {
	schema: {
		params: ChildrenReqParams,
		response: {
			200: LabelWithDescendants,
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
			400: ErrorMessage,
			404: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;