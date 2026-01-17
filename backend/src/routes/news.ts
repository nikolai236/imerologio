import type { FastifyPluginAsync } from "fastify";
import type { NewsEvent, DateString } from "../../../shared/news.types";
import useNews from "../database/news";
import {
	getEntryCalendarSchema,
	getNewsSchema,
	postBulkNewsSchema,
	postNewsSchema
} from "../schemas/news";
import useNewsService from "../services/news";

const router: FastifyPluginAsync = async (server) => {
	const {
		createNewsEvent,
		createManyNewsEvents,
	} = useNews(server.prisma);

	const {
		getEntryCalendar,
		getNewsEventsForDate
	} = useNewsService(server.prisma);

	interface IGet { Querystring: { date?: DateString; types?: string[]; }; }
	server.get<IGet>('/', getNewsSchema, async (req, reply) => {

		const types = req.query.types;
		const date = req.query.date ?
			new Date(req.query.date) : undefined;

		const newsEvents = await getNewsEventsForDate(date, types);
		return reply.code(200).send({ newsEvents });
	});

	interface IGetEntryCalendar { Querystring: { date: DateString; }, }
	server.get<IGetEntryCalendar>(
		'/entry-calendar',
		getEntryCalendarSchema,
		async (req, reply) => {

			const { date } = req.query;
			const calendar = await getEntryCalendar(date);

			return reply.status(201).send(calendar);
		},
	);

	interface IPost { Body: NewsEvent<DateString>; }
	server.post<IPost>('/', postNewsSchema, async (req, reply) => {

		const newsEvent = await createNewsEvent(req.body);
		return reply.code(201).send({ newsEvent });
	});

	interface IPostBulk { Body: NewsEvent<DateString>[]; }
	server.post<IPostBulk>('/bulk', postBulkNewsSchema, async (req, reply) => {

		const updated = await createManyNewsEvents(req.body);
		return reply.code(201).send({ updated });
	});
};

export default router;