import { PrismaClient } from "@prisma/client";
import { DbJournalEntry, JournalEntry, UpdateJournalEntry } from "../../../shared/journal.types";

const include = {
	trades: {
		include: {
			orders: true,
		}
	},
	charts: true,
} as const;

const produceOverwriteObj = <T extends {}>(elements: T[]) => {
	const existingIds = elements
		.map(c => 'id' in c ? c.id : null)
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

export default function journalRepository(db: PrismaClient) {
	const getJournalEntries = async () => {
		const entries = await db.journalEntry.findMany({
			orderBy: { from: "desc" },
			include,
		});

		// @ts-ignore
		return entries as DbJournalEntry<Date, number>[];
	};

	const getJournalEntry = async (id: number) => {
		const entry = await db.journalEntry.findUnique({
			where: { id },
			include,
		});

		return entry as DbJournalEntry<Date, number> | null;
	};

	const createJounrnalEntry = async (
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

		return entry as unknown as DbJournalEntry<Date, number>;
	};

	const updateJournalEntry = async (
		id: number,
		payload: UpdateJournalEntry<string, number>
	) => {
		payload.trades = payload.trades
			?.map(({target, stop, pnl, orders, symbolId, ...rest}) => ({
				...("id" in rest && { id: rest.id }),
				...(target != undefined && { target }),
				...(stop != undefined && { stop }),
				...(pnl != undefined && { pnl }),
				...(symbolId != undefined && { symbolId }),
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

		const modifiedTrades = payload.trades
			?.map(({ orders, symbolId, ...rest }) => ({
				...rest,
				...(symbolId != undefined && {
					symbol: {
						connect: { id: symbolId }
					}
				}),
				...(orders != undefined && {
					orders: produceOverwriteObj(orders)
				})
			}));

		const tradesObj = modifiedTrades
			? { trades: produceOverwriteObj(modifiedTrades) }
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

		return entry as DbJournalEntry<Date, number>;
	};

	return {
		getJournalEntries,
		getJournalEntry,
		createJounrnalEntry,
		updateJournalEntry,
	} as const;
}