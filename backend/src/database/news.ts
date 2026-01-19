import { Prisma, PrismaClient } from "@prisma/client";
import type { DateString, FolderColor, NewsEvent, NewsEventWithId } from "../../../shared/news.types";

const useNews = (db: PrismaClient) => {
	const _cleanNewsEvent = <T extends NewsEvent|NewsEventWithId>(ev: T): T => ({
		...ev,
		date: new Date(ev.date).toISOString(),
	});

	const _getDateClause = (start: Date, end: Date) => {
		return { date: { gte: start, lt: end } };
	};

	const _getOrClause = (values: string[], key: keyof NewsEvent<DateString>) => {
		if (values.length == 0) return undefined;
		if (values.length == 1) return { [key]: values[0], };

		return {
			OR: values.map(value => ({ [key]: value })),
		};
	};

	const _sanitizeNewsEvent = <T extends  Date | DateString>(
		event: NewsEvent<any>
	): NewsEvent<T> => {
		event.currencies = event.currencies.map(
			c => c.toLowerCase()
		);

		const {
			currencies,
			source,
			date,
			allDay,
			folderColor,
			metadata,
			name,
		} = event;

		return {
			currencies,
			source,
			date,
			allDay,
			folderColor,
			metadata,
			name,
		};
	};

	const getNewsEvents = async (
		range?: { from: Date, upTo: Date },
		types?: string[],
		folderColors?: FolderColor[]
	) => {
		let where: Prisma.NewsEventWhereInput|undefined = undefined;

		const addClause = (obj: Prisma.NewsEventWhereInput|undefined) => {
			where = { ...where, ...obj };
		};

		if (range != null) {
			addClause(_getDateClause(range.from, range.upTo));
		}

		if (types != null) {
			addClause(_getOrClause(types, 'name'));
		}

		if (folderColors != null) {
			addClause(_getOrClause(folderColors, 'folderColor'));
		}

		const events = await db.newsEvent.findMany({
			where, orderBy: { date: 'asc', },
		}) as NewsEventWithId<Date>[];

		return events.map(_cleanNewsEvent);
	};

	const createNewsEvent = async (data: NewsEvent<any>) => {
		_sanitizeNewsEvent(data);

		const res = await db.newsEvent.create({ data });
		return _cleanNewsEvent(res as NewsEventWithId<Date>);
	};

	const createManyNewsEvents = async (data: NewsEvent<any>[]) => {
		data.forEach(_sanitizeNewsEvent);

		const { count } = await db.$transaction(async (tx) => {
			return tx.newsEvent.createMany({ data });
		});
		return count;
	};

	return {
		getNewsEvents,
		createNewsEvent,
		createManyNewsEvents,
	};
};

export default useNews;