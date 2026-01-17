const folderColorEnum = [
	"Red", "Orange", "Yellow", "Grey"
] as const;

const newsEventSchema = {
	type: "object",
	additionalProperties: false,
	required: ["date", "name", "currencies", "folderColor"],
	properties: {
		id: { type: "number", },
		date: {
			type: "string",
			format: "date-time",
		},
		name: { type: "string" },
		currencies: {
			type: "array",
			items: {
				type: "string"
			},
		},
		metadata: { type: "object" },
		allDay: { type: "boolean" },
		folderColor: {
			type: "string",
			enum: [...folderColorEnum]
		},
		source: { type: "string", },
	},
} as const;

const newsEventsArray = {
	type: "array",
	items: newsEventSchema
} as const;

export const getNewsSchema = {
	schema: {
		querystring: {
			type: "object",
			additionalProperties: false,
			properties: {
				date: {
					type: "string",
					format: "date-time",
				},
				types: {
					type: "array",
					items: {
						type: "string",
					},
				},
			},
		},
		response: {
			200: {
				type: "object",
				additionalProperties: false,
				required: ["newsEvents"],
				properties: { newsEvents: newsEventsArray },
			},
			400: { $ref: "ErrorMessage#" },
			500: { $ref: "ErrorMessage#" },
		},
	},
} as const;

export const getEntryCalendarSchema = {
	schema: {
		querystring: {
			type: "object",
			additionalProperties: false,
			required: ["date"],
			properties: {
				date: {
					type: "string",
					format: "date-time",
				},
			},
		},
		respose: {
			200: {
				type: "object",
				additionalProperties: false,
				required: ["prev", "current", "next"],
				properties: {
					prev:    newsEventsArray,
					current: newsEventsArray,
					next:    newsEventsArray,
				}
			},
			400: { $ref: "ErrorMessage#" },
			500: { $ref: "ErrorMessage#" },
		}
	}
} as const;

export const postNewsSchema = {
	schema: {
		body: newsEventSchema,
		response: {
			201: {
				type: "object",
				additionalProperties: false,
				required: ["newsEvent"],
				properties: {
					newsEvent: newsEventSchema,
				},
			},
			400: { $ref: "ErrorMessage#" },
			500: { $ref: "ErrorMessage#" },
		},
	},
} as const;

export const postBulkNewsSchema = {
	schema: {
		body: {
			...newsEventsArray,
			minItems: 1,
		},
		response: {
			201: {
				type: "object",
				additionalProperties: false,
				required: ["updated"],
				properties: {
					updated: { type: "number", }
				},
			},
			400: { $ref: "ErrorMessage#" },
			500: { $ref: "ErrorMessage#" },
		},
	},
} as const;