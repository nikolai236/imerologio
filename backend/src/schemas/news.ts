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

export const getNewsEventsRangeSchema = {
	schema: {
		querystring: Type.Object({
			start: DateString,
			end: DateString,
		}),
		response: {
			200: NewsEvents,
			400: ErrorMessage,
			500: ErrorMessage,
		},
	},
} as const;

export const getSingleDayCalendarSchema = {
	schema: {
		querystring: Type.Object({
			date: DateString
		}),
		respose: {
			200: Type.Object({
				prev:    NewsEvents,
				current: NewsEvents,
				next:    NewsEvents,
			}),
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