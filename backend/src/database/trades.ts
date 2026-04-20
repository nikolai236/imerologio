import { Prisma, type PrismaClient } from '@prisma/client'

import type {
	Trade,
	DbTrade,
	DbOrder,
	DbTradeEntry,
	TradeScoringData,
	UpdateTrade,
} from '../../../shared/trades.types';
import journalRepository from './journal';

const cleanOrder = (o: any): DbOrder<number> => ({
	...o,
	quantity: Number(o.quantity),
	price: Number(o.price),
	date: new Date(o.date).getTime(),
});

const produceOverwriteObj = <T extends object>(elements: T[]) => {
	const existingIds = elements
		.map(c => "id" in c ? c.id : null)
		.filter((id): id is number => id != null);

	const deleteMany = existingIds.length > 0
		? { id: { notIn: existingIds } }
		: {};

	type ObjectWithId = T & { id: number; createdAt?: Date };

	const upsert = elements
		.filter((c): c is ObjectWithId => "id" in c && c.id != null)
		.map(({ id, createdAt, ...payload }) => ({
			where: { id },
			create: {
				...(createdAt != null && { createdAt }),
				...payload,
			},
			update: payload,
		}));

	const create = elements
		.filter(c => !("id" in c) || c.id == null)
		.map(c => !("id" in c) ?
			c : (({ id, ...rest }) => ({ ...rest }))(c)
		);

	return { deleteMany, create, upsert } as const;
};

export const cleanTrade = ({ deleted, ...t }: any): any => ({
	...t,
	stop: Number(t.stop),
	pnl: t.pnl != null ? Number(t.pnl) : null,
	target: t.target != null ? Number(t.target) : null,
	orders: t.orders && t.orders.map(cleanOrder),
});

const include = {
	labels: {
		where: {
			label: {
				is: { symbolId: null },
			},
		},
		include: {
			label: true,
		}
	},
	charts: {
		orderBy: {
			createdAt: "asc",
		}
	},
	orders: true,
	symbol: true,
} as const;

type DB = PrismaClient | Prisma.TransactionClient;

export default function tradeRepository(db: DB) {
	const getAllTrades = async (
		labelIds?: number[],
		from?: number,
		to?: number,
	) => {
		const filters: Prisma.Sql[] = [];

		if (from != null) filters.push(Prisma.sql`o.date >= ${new Date(from)}`);
		if (to   != null) filters.push(Prisma.sql`o.date <= ${new Date(to)}`);

		const whereClause = filters.length > 0 ?
			Prisma.sql`AND ${Prisma.join(filters, " AND ")}` :
			Prisma.empty;

		const labelJoin = labelIds != null && labelIds.length > 0 ?
			Prisma.sql`INNER JOIN "trade_labels" lt ON 
				lt."tradeId" = t.id AND lt."labelId" IN (${Prisma.join(labelIds)})` :
			Prisma.empty;

		const trades = await db.$queryRaw<DbTradeEntry<number>[]>`
			SELECT
				t.*,
				MIN(o.date) AS "entryDate",
				COALESCE(
					json_agg(
						json_build_object(
							'id',       o.id,
							'quantity', o.quantity,
							'date',     o.date,
							'price',    o.price,
							'type',     o.type,
							'tradeId',  o."tradeId"
						)
						ORDER BY o.date ASC
					),
					'[]'::json
				) AS orders
			FROM "Trade" t
			${labelJoin}
			LEFT JOIN "Order" o ON o."tradeId" = t.id
			WHERE NOT deleted ${whereClause}
			GROUP BY t.id
			ORDER BY "entryDate" DESC NULLS LAST, t.id ASC;
		`;
		return trades.map(cleanTrade) as unknown as DbTradeEntry<number>[];
	};

	const getTradeScoringData = async () => {
		const data = await db.$queryRaw<any[]>`
		SELECT
			t.id,
			t.stop,
			COALESCE(
				SUM(
					CASE
						WHEN o.type = 'SELL' THEN  o.quantity * o.price
						WHEN o.type = 'BUY'  THEN -o.quantity * o.price
						ELSE 0
					END
				),
				0
			) AS pnl,
			entry.price AS "entryPrice",
			entry.quantity AS "entryQuantity"
		FROM "Trade" t

		LEFT JOIN "Order" o
			ON o."tradeId" = t.id

		LEFT JOIN (
			SELECT DISTINCT ON ("tradeId")
				"tradeId",
				quantity,
				price
			FROM "Order"
			ORDER BY "tradeId", date ASC
		) entry
			ON entry."tradeId" = t.id

		WHERE t.deleted = false

		GROUP BY t.id, entry.price, entry.quantity
		ORDER BY t.id;
		`;

		return data.map(({ id, stop, pnl, entryPrice, entryQuantity }) => ({
			id,
			pnl: Number(pnl),
			risk: Math.abs(entryPrice - stop) * entryQuantity
		} as TradeScoringData));
	};

	const getTradeById = async (id: number) => {
		const orders = {
			orderBy: {
				date: "asc" as Prisma.SortOrder,
			}
		};

		const trade = await db.trade.findFirst({
			include: { ...include, orders },
			where: { id, deleted: false },
		});
		if (trade == null) return null;

		trade.labels = trade.labels.map((o: any) => o.label);
		return cleanTrade(trade) as DbTrade<number, number>;
	};

	const createTrade = async (trade: Trade<number, Date>) => {
		const data = {
			...trade,
			deleted: false,
			orders: { create: trade.orders },
			charts: { create: trade.charts  },
			labels: {
				create: trade.labels.map(({ id }) => ({
					label: { connect: { id } },
				})),
			},
		};
		const ret = await db.trade.create({ include, data });
		ret.labels = ret.labels.map((o: any) => o.label);
		return cleanTrade(ret) as DbTrade<number, number>;
	};

	const updateTrade = async (
		id: number, payload: UpdateTrade<number, Date>,
	) => {
		const charts = payload.charts == null ?
			undefined : produceOverwriteObj(payload.charts);

		const orders = payload.orders == null ?
			undefined : produceOverwriteObj(payload.orders);

		const symbol = payload.symbolId == null ?
			undefined : { connect: { id: payload.symbolId} };
	
		const {
			target,
			stop,
			pnl,
			description,
		} = payload;

		const data = {
			...(pnl != null ? { pnl } : undefined),
			...(stop != null ? { stop } : undefined),
			...(target != null ? { target } : undefined),
			...(description != null ? { description } : undefined),

			...(charts && { charts }),
			...(orders && { orders }),
			...(symbol && { symbol }),

			...(payload.labels && {
				labels: {
					deleteMany: { tradeId: id },
					create: payload.labels.map(
						(connect) => ({ label: { connect }, })
					),
				},
			}),
		};

		const ret = await db.trade.update({
			where: { id },
			// @ts-ignore
			data,
			include,
		});
		//@ts-ignore
		ret.labels = ret.labels.map((o: any) => o.label);

		return cleanTrade(ret) as DbTrade<number, number>;
	};

	const deleteTrade = async (id: number) => {
		// return await db.trade.delete({ where: { id }});
		await db.trade.update({
			where: { id },
			data: { deleted: true } 
		});
	};

	const getOrderById = async (id: number) => {
		const order = await db.order.findUnique({ where: { id } });
		return cleanOrder(order);
	};

	const getTradesForLabels = async (
		includeIds: number[],
		excludeIds: number[]
	) => {
		const trades = await db.trade.findMany({
			where: {
				AND: [
					...includeIds.map(labelId => ({
						labels: { some: { labelId } },
					})),
					...(excludeIds.length > 0
						? [{
							labels: {
								none: {
									labelId: {
										in: excludeIds
									}
								}
							}
						}]
						: []
					)
				],
			},
			include
		});

		return trades.map(cleanTrade) as DbTrade<number, number>[];
	};

	return {
		getAllTrades,
		getTradeById,
		createTrade,
		deleteTrade,
		updateTrade,
		getTradesForLabels,
		getOrderById,
		getTradeScoringData,
	} as const;
}
