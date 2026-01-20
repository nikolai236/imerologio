import { Type } from "@sinclair/typebox";
import { IdParams, ErrorMessage, Labels, Label } from "./common";

export const getLabelsSchema = {
	schema: {
		response: {
			200: Labels,
			400: ErrorMessage,
			500: ErrorMessage,
		},
	},
} as const;

export const postLabelSchema = {
	schema: {
		body: Type.Omit(
			Label, ["id", "tradeId"]
		),
		response: {
			201: Type.Object({
				label: Label
			}, { additionalProperties: false }),
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
			}, { additionalProperties: false }),
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
			}, { additionalProperties: false }),
			404: ErrorMessage,
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
}