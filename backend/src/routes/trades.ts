import type { FastifyPluginAsync } from "fastify";

import useSymbols from "../database/symbols";
import useTrades from "../database/trades";
import useTradeService from "../services/trades";

import type { Chart, TradeWithOrders } from "../../../shared/trades.types";
import useLabels from "../database/labels";
import { ChartStringTf } from "../../../shared/candles.types";
import useCandleService from "../services/candles";

const router: FastifyPluginAsync = async (server) => {
	const { getAllTrades, getTradeById, createTrade } = useTrades(server.prisma);
	const { deleteTradeFromLabel } = useLabels(server.prisma);
	const { getSymbolById } = useSymbols(server.prisma);

	const { tfToNumber } = useCandleService();
	const { calculatePnL, checkQuantities } = useTradeService();

	server.get('/', async (_req, reply) => {
		const trades = await getAllTrades();
		trades
			.filter(({ pnl }) => pnl == null)
			.forEach(calculatePnL);

		return reply.code(200).send({ trades });
	});

	interface IGet { Params: { id: number } }
	server.get<IGet>('/:id', async (req, reply) => {
		const id = Number(req.params.id);

		const trade = await getTradeById(id);
		if (trade == null) {
			return reply.code(404).send({ message: 'Trade not found!', });
		}
		return reply.code(200).send({ trade });
	});

	interface IPost { Body: TradeWithOrders<ChartStringTf>; }
	server.post<IPost>('/', async (req, reply) => {
		let { target, stop, pnl, symbolId, orders, charts } = req.body;

		if (!checkQuantities(orders)) {
			return reply.code(400).send({ message: 'Trade is open!' });
		}

		const symbol = await getSymbolById(Number(symbolId));
		if (symbol == null) {
			return reply.code(400).send({ message: 'Symbol not found!' });
		}

		orders = orders.map(o => ({
			...o,
			quantity: Number(o.quantity),
			date:     new Date(o.date),
			price:    Number(o.price),
		}));

		const transformedCharts: Chart[] = charts.map(c => ({
			start: Number(c.start),
			end: Number(c.end),
			timeframe: tfToNumber(c.timeframe),
		}));

		const badCharts = transformedCharts.some(
			c => [c.start, c.end, c.timeframe].some(isNaN)
		);
		if (badCharts) {
			const message = "Bad charts provided";
			return reply.code(400).send({ message });
		}

		const trade: TradeWithOrders<Chart> = {
			...req.body,
			target: target && Number(target),
			pnl: pnl && Number(pnl),
			stop: Number(stop),
			orders,
			charts: transformedCharts,
		};

		if (pnl == null) calculatePnL(trade);

		try {
			const ret = await createTrade(trade);
			return reply.code(200).send({ trade: ret });
		} catch(err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface IDelete { Params: { tradeId: number; labelId: number }; };
	server.delete<IDelete>('/:tradeId/labels/:labelId', async (req, reply) => {
		const tradeId = Number(req.params.tradeId);
		const labelId = Number(req.params.labelId);

		const trade = await getTradeById(tradeId);
		if (trade == null) {
			return reply.code(404).send({ message: 'Trade not found!', });
		}

		await deleteTradeFromLabel(labelId, tradeId);
		return reply.code(201).send();
	});
};

export default router;