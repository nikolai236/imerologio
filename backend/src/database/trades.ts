import type { Prisma, PrismaClient } from '@prisma/client'
import type { TradeWithOrders, TradeFullWithId, OrderWithId } from '../../../shared/trades.types';

const useTrades = (db: PrismaClient) => {
	const include = {
		orders: true,
		symbol: true,
		labels: true,
		charts: true,
	};

	const _cleanOrder = (o: any): OrderWithId => ({
		...o,
		quantity: Number(o.quantity),
		price: Number(o.price),
		date: new Date(o.date),
	});

	const _cleanTrade = (t: any): TradeFullWithId => ({
		...t,
		stop: Number(t.stop),
		pnl: t.pnl && Number(t.pnl),
		target: t.target && Number(t.target),
		orders: t.orders && t.orders.map(_cleanOrder),  
	});

	const getAllTrades = async () => {
		const trades = await db.$queryRaw<TradeWithOrders[]>`
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
		return trades.map(_cleanTrade);
	};

	const getTradeById = async (id: number) => {
		const trade = await db.trade.findUnique({
			include: { ...include, orders: { orderBy: { date: 'asc' } } },
			where: { id },
		});
		return _cleanTrade(trade);
	};

	const createTrade = async (trade: TradeWithOrders) => {
		const data = {
			...trade,
			orders: { create: trade.orders, },
			charts: { create: trade.charts  },
			labels: { connect: trade.labels },
		};
		const ret = await db.trade.create({ include, data });
		return _cleanTrade(ret);
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
		getOrderById,
	};
};

export default useTrades;
