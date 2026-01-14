import type { Prisma, PrismaClient } from '@prisma/client'
import type { Trade, DbTrade, DbOrder, Chart, Order, DbChart, ChartUnion, OrderUnion, TradeEntry, DbTradeEntry, ApiTrade } from '../../../shared/trades.types';

const useTrades = (db: PrismaClient) => {
	const include = {
		orders: true,
		symbol: true,
		labels: true,
		charts: true,
	};

	const _cleanOrder = (o: any): DbOrder<number> => ({
		...o,
		quantity: Number(o.quantity),
		price: Number(o.price),
		date: new Date(o.date).getTime(),
	});

	const _produceIncludeObj = <T extends {}>(elements: T[]) => {
		const existingIds = elements
			.map(c => 'id' in c ? c.id : null)
			.filter((id): id is number => id != null);

		const deleteMany = existingIds.length > 0 ?
			{ id: { notIn: existingIds } } : {}

		type DbObj = T & { id: number };
		const upsert = elements.filter((c): c is DbObj => 'id' in c).map(c => ({
			where: { id: c.id },
			create: { ...c, id: undefined },
			update: { ...c, id: undefined },
		}));

		const create = elements
			.filter(c => !('id' in c))
			.map(c => ({ ...c }));

		return { deleteMany, create, upsert };
	};

	type TradeReturnType = DbTrade<ChartUnion<number>, OrderUnion<Date>>;
	const _cleanTrade = (t: any): TradeReturnType => ({
		...t,
		stop: Number(t.stop),
		pnl: t.pnl && Number(t.pnl),
		target: t.target && Number(t.target),
		orders: t.orders && t.orders.map(_cleanOrder),  
	});

	const getAllTrades = async () => {
		const trades = await db.$queryRaw<Trade[]>`
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
					) FILTER (WHERE o.id IS NOT NULL),
					'[]'::json
				) AS orders
			FROM "Trade" t
			LEFT JOIN "Order" o ON o."tradeId" = t.id
			GROUP BY t.id
			ORDER BY "entryDate" ASC NULLS LAST, t.id ASC;
		`;
		return trades.map(_cleanTrade) as DbTradeEntry[];
	};

	const getTradeById = async (id: number) => {
		const orders = { orderBy: { date: 'asc' as Prisma.SortOrder } };

		const trade = await db.trade.findUnique({
			include: { ...include, orders },
			where: { id },
		});

		return _cleanTrade(trade) as DbTrade<DbChart<number>, DbOrder<Date>>;
	};

	const createTrade = async (trade: Trade<Chart<number>, Order<Date>>) => {
		const data = {
			...trade,
			orders: { create: trade.orders, },
			charts: { create: trade.charts  },
			labels: { connect: trade.labels },
		};
		const ret = await db.trade.create({ include, data });
		return _cleanTrade(ret) as DbTrade<DbChart<number>, DbOrder<Date>>;
	};

	type TradeType = Partial<
		Trade<ChartUnion<number>, OrderUnion<Date>>
	>;

	const updateTrade = async (
		id: number,
		payload: TradeType,
	) => {
		const charts = payload.charts == null ?
			undefined :
			_produceIncludeObj(payload.charts);

		const orders = payload.orders == null ?
			undefined :
			_produceIncludeObj(payload.orders);

		const labels = payload.labels &&
			{ set: payload.labels.map(({ id }) => ({ id })) };

		const symbol = payload.symbolId == null ?
			undefined :
			{ connect: { id: payload. symbolId} };

		const data = {
			...payload,
			symbolId: undefined,
			charts,
			orders,
			labels,
			symbol,
		};

		const include = {
			labels: true,
			charts: true,
			orders: true,
			symbol: true,
		};

		const ret = await db.trade.update({
			where: { id }, data, include,
		});

		return _cleanTrade(ret) as DbTrade<DbChart<number>, DbOrder<Date>>;;
	};

	const deleteTrade = async (id: number) => {
		return await db.trade.delete({ where: { id }});
	};

	const getOrderById = async (id: number) => {
		const order = await db.order.findUnique({ where: { id } });
		return _cleanOrder(order);
	};

	return {
		getAllTrades,
		getTradeById,
		createTrade,
		deleteTrade,
		updateTrade,
		getOrderById,
	};
};

export default useTrades;
