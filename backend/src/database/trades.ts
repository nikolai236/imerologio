import { Prisma, type PrismaClient } from '@prisma/client'

import type {
	Trade,
	DbTrade,
	DbOrder,
	Chart,
	Order,
	DbChart,
	ChartUnion,
	OrderUnion,
	DbTradeEntry,
	TradeScoringData,
} from '../../../shared/trades.types';
import { DateString } from '../../../shared/news.types';

type TradeReturnType = DbTrade<ChartUnion<number>, OrderUnion<Date>>;

const cleanOrder = (o: any): DbOrder<number> => ({
	...o,
	quantity: Number(o.quantity),
	price: Number(o.price),
	date: new Date(o.date).getTime(),
});

const produceIncludeObj = <T extends {}>(elements: T[]) => {
	const existingIds = elements
		.map(c => 'id' in c ? c.id : null)
		.filter((id): id is number => id != null);

	const deleteMany = existingIds.length > 0 ?
		{ id: { notIn: existingIds } } : {}

	type ObjectWithId = T & { id: number };
	const upsert = elements
		.filter((c): c is ObjectWithId => 'id' in c && c.id != null)
		.map(({ id, ...payload }) => ({
			where: { id },
			create: payload,
			update: payload,
		}));

	const create = elements
		.filter(c => !('id' in c) || c.id == null)
		.map(c => !("id" in c) ?
			c : (({ id, ...rest }) => ({ ...rest }))(c)
		);

	return { deleteMany, create, upsert };
};

const cleanTrade = ({ deleted, ...t }: any): TradeReturnType => ({
	...t,
	stop: Number(t.stop),
	pnl: t.pnl != null ? Number(t.pnl) : null,
	target: t.target != null ? Number(t.target) : null,
	orders: t.orders && t.orders.map(cleanOrder),
});

const useTrades = (db: PrismaClient) => {
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
		charts: true,
		orders: true,
		symbol: true,
	} as const;

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

		console.log(whereClause)
		const trades = await db.$queryRaw<DbTrade<DbChart<number>, DbOrder<Date>>[]>`
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
			ORDER BY "entryDate" ASC NULLS LAST, t.id ASC;
		`;
		return trades.map(cleanTrade) as DbTradeEntry<Order<Date>>[];
	};

	const getTradeScoringData = async () => {
		const data = await db.$queryRaw<TradeScoringData[]>`
			SELECT
				t.id,
				COALESCE(
					SUM(
						CASE
							WHEN o.type = 'SELL' THEN  o.quantity * o.price
							WHEN o.type = 'BUY'  THEN -o.quantity * o.price
							ELSE 0
						END
					),
					0
				) AS pnl
			FROM "Trade" t
			LEFT JOIN "Order" o
				ON o."tradeId" = t.id
			WHERE t.deleted = false
			GROUP BY t.id
			ORDER BY t.id
		`;

		data.forEach(e => { e.pnl = Number(e.pnl); });
		return data;
	};

	// gate to all CRUD operations
	const getTradeById = async (id: number) => {
		const orders = { orderBy: { date: 'asc' as Prisma.SortOrder } };

		const trade = await db.trade.findFirst({
			include: { ...include, orders },
			where: { id, deleted: false },
		});
		if (trade == null) return null;

		trade.labels = trade.labels.map((o: any) => o.label);
		return cleanTrade(trade) as DbTrade<
			DbChart<number>, DbOrder<Date>
		>;
	};

	const createTrade = async (trade: Trade<Chart<number>, Order<Date>>) => {
		const data = {
			...trade,
			deleted: false,
			orders: { create: trade.orders, },
			charts: { create: trade.charts  },
			labels: {
				create: trade.labels.map((connect) => ({
					label: { connect },
				})),
			},
		};
		const ret = await db.trade.create({ include, data });
		ret.labels = ret.labels.map((o: any) => o.label);
		return cleanTrade(ret) as DbTrade<DbChart<number>, DbOrder<Date>>;
	};

	type TradeType = Partial<
		Trade<ChartUnion<number>, OrderUnion<Date>>
	>;

	const updateTrade = async (
		id: number,
		payload: TradeType,
	) => {
		const charts = payload.charts == null ?
			undefined : produceIncludeObj(payload.charts);

		const orders = payload.orders == null ?
			undefined : produceIncludeObj(payload.orders);

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
				labels: payload.labels && {
					deleteMany: { tradeId: id },
					create: payload.labels.map(
						(connect) => ({ label: { connect }, })
					),
				},
			}),
		};

		const ret = await db.trade.update({
			where: { id },
			data,
			include,
		});
		ret.labels = ret.labels.map((o: any) => o.label);

		return cleanTrade(ret) as DbTrade<
			DbChart<number>, DbOrder<Date>
		>;
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

	return {
		getAllTrades,
		getTradeById,
		createTrade,
		deleteTrade,
		updateTrade,
		getOrderById,
		getTradeScoringData,
	} as const;
};

export default useTrades;
