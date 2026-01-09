import { PrismaClient } from "@prisma/client";
import type { NewsEvent, NewsEventWithId } from "../../../shared/news.types";

const useNews = (db: PrismaClient) => {
	const _cleanNewsEvent = <T extends NewsEvent|NewsEventWithId>(ev: T): T => ({
		...ev,
		eventTs: new Date(ev.eventTs),
	});

	const getAllNewsEvents = async () => {
		const evs = await db.newsEvent.findMany() as NewsEventWithId[];
		return evs.map(_cleanNewsEvent);
	};

	const getNewsEventsFor = async (date: Date) => {
		const start = new Date(Date.UTC(
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDay(),
			0, 0, 0, 0,
		));

		const end = new Date(start);
		end.setUTCDate(end.getUTCDate() + 1);

		const evs = await db.newsEvent.findMany({
			where: { eventTs: { gte: start, lte: end }, },
			orderBy: { eventTs: 'asc', },
		}) as NewsEventWithId[];

		return evs.map(_cleanNewsEvent);
	};

	const createNewsEvent = async (payload: NewsEvent) => {
		const res = await db.newsEvent.create({ data: payload });
		return _cleanNewsEvent(res as NewsEventWithId);
	};

	return {
		getAllNewsEvents,
		getNewsEventsFor,
		createNewsEvent
	};
};

export default useNews;