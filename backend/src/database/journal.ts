import type { PrismaClient } from "@prisma/client";
import type {
	DbJournalEntry,
	JournalEntry,
	JournalOrder,
	JournalTrade,
	UpdateJournalEntry,
	UpdateJournalOrder,
	UpdateJournalTrade
} from "../../../shared/journal.types";

const include = {
	trades: {
		include: {
			orders: true,
			labels: {
				include: {
					label: true
				}
			}
		}
	},
	charts: {
		orderBy: {
			createdAt: "asc",
		}
	},
} as const;

const sanitize = (
	{ trades, ...entry }: any
) => ({
	...entry,
	trades: trades.map(({ labels, ...trade }: any) => ({
		...trade,
		labels: labels.map(({ label }: any) => label),
	}))
})

const produceOverwriteObj = <T extends object>(elements: T[]) => {
	const existingIds = elements
		.map(c => "id" in c ? c.id : null)
		.filter((id): id is number => id != null);

	const deleteMany = existingIds.length > 0
		? { id: { notIn: existingIds } }
		: {};

	type ObjectWithId = T & { id: number };

	const upsert = elements
		.filter((c): c is ObjectWithId => "id" in c && c.id != null)
		.map(({ id, ...payload }) => ({
			where: { id },
			create: payload,
			update: payload,
		}));

	const create = elements
		.filter(c => !("id" in c) || c.id == null)
		.map(c => !("id" in c) ?
			c : (({ id, ...rest }) => ({ ...rest }))(c)
		);

	return { deleteMany, create, upsert } as const;
};

const buildCreate = <T>(
	elements: (T & { id?: number })[]
) => ({
	create: elements.map(({ id, ...rest }) => rest),
});

const buildOrdersUpdate = (
	orders: (UpdateJournalOrder<string> | JournalOrder<string>)[]
) => produceOverwriteObj(orders);

const buildTradesUpdate = (trades: (UpdateJournalTrade<string> | JournalTrade<string>)[]) => {
	trades = trades.filter(t => t != null) ;

	const existingIds = trades
		.map(t => ("id" in t ? t.id : null))
		.filter((id): id is number => id != null);

	return {
		deleteMany: existingIds.length > 0
			? { id: { notIn: existingIds } }
			: {},
		create: trades
			.filter(t => !("id" in t) || t.id == null)
			.map(({ orders, labels, ...trade }) => ({
				...trade,
				...(orders && { orders: buildCreate(orders) }),
				...(labels && { labels: {
						create: labels.map(({ id }) => ({
							label: { connect: { id } }
						})) 
					}
				}),
			})),
		upsert: trades
			.filter((t): t is typeof t & { id: number } => "id" in t && t.id != null)
			.map(({ id, orders, labels, ...trade }) => ({
				where: { id },
				create: {
					...trade,
					...(orders && { orders: buildCreate(orders) }),
					...(labels && { labels: {
							create: labels.map(({ id }) => ({
								label: { connect: { id } }
							})) 
						}
					}),
				},
				update: {
					...trade,
					...(orders && { orders: buildOrdersUpdate(orders) }),
					...(labels && { labels: {
							deleteMany: { tradeId: id },
							create: labels.map(({ id }) => ({
								label: { connect: { id } }
							})) 
						}
					}),
				},
			})),
	};
};

export default function journalRepository(db: PrismaClient) {
	const getJournalEntries = async () => {
		const entries = await db.journalEntry.findMany({
			orderBy: { from: "desc" },
			include,
		});

		const sanitized = entries.map(sanitize);
		// @ts-ignore
		return sanitized as DbJournalEntry<Date, number>[];
	};

	const getJournalEntry = async (id: number) => {
		const entry = await db.journalEntry.findUnique({
			where: { id },
			include,
		});

		const sanitized = sanitize(entry);
		return sanitized as DbJournalEntry<Date, number> | null;
	};

	const createJournalEntry = async (
		payload: JournalEntry<string, number>
	) => {
		const charts = payload.charts ? {
			create: payload.charts.map(c => ({
				timeframe: c.timeframe,
				start: c.start,
				end: c.end,
				objects: c.objects,
				symbol: {
					connect: { id: c.symbolId, },
				},
			})),
		} : undefined;

		const trades = payload.trades ? {
			create: payload.trades.map(t => ({
				target: t.target,
				stop: t.stop,
				pnl: t.pnl,
				symbol: {
					connect: { id: t.symbolId, },
				},
				orders: {
					create: t.orders.map(o => ({
						quantity: o.quantity,
						date: o.date,
						price: o.price,
						type: o.type,
					})),
				},
				labels: {
					create: t.labels.map(({ id }) => ({
						label: { connect: { id } },
					}))
				}
			}))
		} : undefined;

		const entry = await db.journalEntry.create({
			include,
			data: {
				title: payload.title,
				content: payload.content,
				from: payload.from,
				to: payload.to,
				...(charts && { charts }),
				...(trades && { trades }),
			},
		});

		const sanitized = sanitize(entry);
		return sanitized as unknown as DbJournalEntry<Date, number>;
	};

	const updateJournalEntry = async (
		id: number,
		payload: UpdateJournalEntry<string, number>
	) => {
		payload.trades = payload.trades
			?.map(({target, stop, pnl, orders, symbolId, labels, ...rest}) => ({
				...("id" in rest && { id: rest.id }),
				...(target != undefined && { target }),
				...(stop != undefined && { stop }),
				...(pnl != undefined && { pnl }),
				...(symbolId != undefined && { symbolId }),
				...(labels != undefined && {
					labels: labels.map(({ id }) => ({ id })),
				}),
				...(orders != undefined && {
					orders: orders
						.map(({ quantity, date, price, type, ...rest }) => ({
							...("id" in rest && { id: rest.id }),
							...(quantity != undefined && { quantity }),
							...(price != undefined && { price }),
							...(date != undefined && { date }),
							...(type != undefined && { type }),
						})),
				}),
			}));

		const modifiedCharts = payload.charts
			?.map(({ start, end, objects, timeframe, symbolId, ...rest }) => ({
				...("id" in rest && { id: rest.id }),
				...(start != undefined && { start }),
				...(end != undefined && { end }),
				...(objects != undefined && { objects }),
				...(timeframe != undefined && { timeframe }),
				...(symbolId != undefined && {
					symbol: {
						connect: { id: symbolId }
					}
				}),
			}));

		const tradesObj = payload.trades
			? { trades: buildTradesUpdate(payload.trades) }
			: undefined;

		const chartsObj = modifiedCharts
			? { charts: produceOverwriteObj(modifiedCharts) }
			: undefined;

		const { title, from, to , content } = payload;

		const data = {
			...(title != undefined && { title }),
			...(from != undefined && { from }),
			...(to != undefined && { to }),
			...(content != undefined && { content }),
			...chartsObj,
			...tradesObj,
		};

		const entry = await db.journalEntry.update({
			// @ts-ignore
			data,
			include,
			where: { id },
		});

		const sanitized = sanitize(entry);
		return sanitized as DbJournalEntry<Date, number>;
	};

	return {
		getJournalEntries,
		getJournalEntry,
		createJournalEntry,
		updateJournalEntry,
	} as const;
}