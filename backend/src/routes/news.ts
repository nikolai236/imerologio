import type { FastifyPluginAsync } from "fastify";
import type { NewsEvent, DateString } from "../../../shared/news.types";
import newsRepository from "../database/news";
import {
	getSingleDayCalendarSchema,
	getNewsEventsSchema,
	postBulkNewsSchema,
	postNewsSchema,
	getNewsEventsRangeSchema
} from "../schemas/news";
import newsService from "../services/news";
import { ValidationError } from "../errors";

const router: FastifyPluginAsync = async (server) => {
	const {
		createNewsEvent,
		createManyNewsEvents,
	} = newsRepository(server.prisma);

	const {
		getNewsEventsForRange,
		getSingleDayCalendar,
		getNewsEventsForDate
	} = newsService(server.prisma);

	interface Get {
		Querystring: {
			date?: DateString;
			types?: string[];
		}
	}
	server.get<Get>("/", getNewsEventsSchema, async (req, reply) => {
		const types = req.query.types;
		const date = req.query.date
			? new Date(req.query.date)
			: undefined;

		const newsEvents = await getNewsEventsForDate(date, types);
		return reply.code(200).send({ newsEvents });
	});

	interface GetRange {
		Querystring: {
			start: DateString;
			end: DateString;
		}
	}
	server.get<GetRange>(
		"/range",
		getNewsEventsRangeSchema,
		async (req, reply) => {
			const { start, end } = req.query;

			const startDate = new Date(start);
			const endDate = new Date(end);

			const calendar = await getNewsEventsForRange(startDate, endDate);
			return reply.code(200).send(calendar);
		}
	);

	interface GetSingleDayCalendar { Querystring: { date: DateString; } }
	server.get<GetSingleDayCalendar>(
		"/single-day-calendar",
		getSingleDayCalendarSchema,
		async (req, reply) => {
			const { date } = req.query;
			const calendar = await getSingleDayCalendar(date);

			return reply.code(200).send(calendar);
		},
	);

	interface Post { Body: NewsEvent<DateString>; }
	server.post<Post>("/", postNewsSchema, async (req, reply) => {
		try {
			const newsEvent = await createNewsEvent(req.body);
			return reply.code(201).send({ newsEvent });
		} catch (err) {
			server.log.error(err);
			throw new ValidationError(String(err));
		}
	});

	interface PostBulk { Body: NewsEvent<DateString>[]; }
	server.post<PostBulk>("/bulk", postBulkNewsSchema, async (req, reply) => {
		try {
			const updated = await createManyNewsEvents(req.body);
			return reply.code(201).send({ updated });
		} catch (err) {
			server.log.error(err);
			throw new ValidationError(String(err));
		}
	});
};

export default router;