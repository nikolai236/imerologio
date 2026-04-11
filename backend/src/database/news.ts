import type { Prisma, PrismaClient } from "@prisma/client";
import type {
	DateString,
	FolderColor,
	NewsEvent,
	DbNewsEvent
} from "../../../shared/news.types";

const sanitize = <T extends  Date | DateString>(
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

const cleanDate = <T extends NewsEvent|DbNewsEvent>(ev: T): T => ({
	...ev,
	date: new Date(ev.date).toISOString(),
});

const getDateClause = (start: Date, end: Date) => {
	return { date: { gte: start, lt: end } } as const;
};

const getOrClause = (values: string[], key: keyof NewsEvent<DateString>) => {
	if (values.length == 0) return undefined;
	if (values.length == 1) return { [key]: values[0], };

	return {
		OR: values.map(value => ({ [key]: value })),
	} as const;
};

export default function newsRepository(db: PrismaClient) {
	const getNewsEvents = async (
		range?: { from: Date, upTo: Date },
		types?: string[],
		folderColors?: FolderColor[]
	) => {
		let where: Prisma.NewsEventWhereInput | undefined = undefined;

		const addClause = (obj: Prisma.NewsEventWhereInput | undefined) => {
			where = { ...where, ...obj };
		};

		if (range != null) {
			addClause(getDateClause(range.from, range.upTo));
		}

		if (types != null) {
			addClause(getOrClause(types, 'name'));
		}

		if (folderColors != null) {
			addClause(getOrClause(folderColors, 'folderColor'));
		}

		const events = await db.newsEvent.findMany({
			where,
			orderBy: { date: 'asc', },
		}) as DbNewsEvent<Date>[];

		return events
			.map(cleanDate)
			.filter(e => e.currencies.includes("usd"));
	};

	const createNewsEvent = async (data: NewsEvent<any>) => {
		sanitize(data);

		const res = await db.newsEvent.create({ data });
		return cleanDate(res as DbNewsEvent<Date>);
	};

	const createManyNewsEvents = async (data: NewsEvent<any>[]) => {
		data.forEach(sanitize);

		const { count } = await db.$transaction(
			async (tx) => tx.newsEvent.createMany({ data })
		);
		return count;
	};

	return {
		getNewsEvents,
		createNewsEvent,
		createManyNewsEvents,
	} as const;
}
