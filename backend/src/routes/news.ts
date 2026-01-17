import type { FastifyPluginAsync } from "fastify";
import type { NewsEvent, DateString } from "../../../shared/news.types";
import useNews from "../database/news";
import {
	getEntryCalendarSchema,
	getNewsEventsSchema,
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
	server.get<IGet>('/', getNewsEventsSchema, async (req, reply) => {

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

			return reply.status(200).send(calendar);
		},
	);

	interface IPost { Body: NewsEvent<DateString>; }
	server.post<IPost>('/', postNewsSchema, async (req, reply) => {
		try {
			const newsEvent = await createNewsEvent(req.body);
			return reply.code(201).send({ newsEvent });
		} catch (err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface IPostBulk { Body: NewsEvent<DateString>[]; }
	server.post<IPostBulk>('/bulk', postBulkNewsSchema, async (req, reply) => {
		try {
			const updated = await createManyNewsEvents(req.body);
			return reply.code(201).send({ updated });
		} catch (err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});
};

export default router;