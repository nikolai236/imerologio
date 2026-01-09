import type { FastifyPluginAsync } from "fastify";
import { NewsEvent } from "../../../shared/news.types";
import useNews from "../database/news";

type DateString = string;

const isValidDate = (date: DateString) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return false;
	}

	const [y, m, d] = date.split("-").map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));

	return (
		dt.getUTCFullYear() === y &&
		dt.getUTCMonth() === m - 1 &&
		dt.getUTCDate() === d
	);
};

const router: FastifyPluginAsync = async (server) => {
	const {
		getAllNewsEvents,
		getNewsEventsFor,
		createNewsEvent
	} = useNews(server.prisma);

	server.get('/', async (_req, reply) => {
		const newsEvents = await getAllNewsEvents();
		return reply.code(200).send({ newsEvents });
	});

	interface IGet { Params: { dateStr: DateString; }; }
	server.get<IGet>('/:dateStr', async (req, reply) => {

		if (!isValidDate(req.params.dateStr)) {
			const message = "Bad date provided";
			return reply.code(400).send({ message });
		}

		const date = new Date(req.params.dateStr);
		const newsEvents = getNewsEventsFor(date);

		return reply.code(200).send({ newsEvents });
	});

	interface IPost { Body: NewsEvent; }
	server.post<IPost>('/', async (req, reply) => {
		let { eventTs, currencies, folderColor, name } = req.body;

		const dateValid = isValidDate(eventTs.toString());
		const colorValid = [
			'Grey', 'Yellow', 'Red', 'Orange'
		].includes(folderColor);

		if (!name || !dateValid || !colorValid) {
			const message = "Bad news event body provided";
			return reply.code(400).send({ message }); 
		}

		currencies = currencies.map(s => s.toUpperCase());
		const payload = { ...req.body, currencies };

		const newsEvent = await createNewsEvent(payload);
		return reply.code(201).send({ newsEvent });
	});
};

export default router;