import { Type } from "@sinclair/typebox";
import { DateString, ErrorMessage, NewsEvent, NewsEvents } from "./common";

export const getNewsEventsSchema = {
	schema: {
		querystring: Type.Object({
			date: Type.Optional(DateString),
			types: Type.Optional(Type.Array(Type.String())),
		}, { additionalProperties: false }),
		response: {
			200: Type.Object({
				newsEvents: NewsEvents,
			}),
			400: ErrorMessage,
			500: ErrorMessage,
		},
	},
} as const;

export const getEntryCalendarSchema = {
	schema: {
		querystring: Type.Object({
			date: DateString
		}, { additionalProperties: false }),
		respose: {
			200: Type.Object({
				prev:    NewsEvents,
				current: NewsEvents,
				next:    NewsEvents,
			}, { additionalProperties: false }),
			400: ErrorMessage,
			500: ErrorMessage,
		}
	}
} as const;

export const postNewsSchema = {
	schema: {
		body: NewsEvent,
		response: {
			201: Type.Object({
				newsEvent: NewsEvent,
			}, { additionalProperties: false }),
			400: ErrorMessage,
			500: ErrorMessage,
		},
	},
} as const;

export const postBulkNewsSchema = {
	schema: {
		body: Type.Array(NewsEvent, { minItems: 1 }),
		response: {
			201: Type.Object({
				updated: Type.Integer(),
			}, { additionalProperties: false }),
			400: ErrorMessage,
			500: ErrorMessage,
		},
	},
} as const;