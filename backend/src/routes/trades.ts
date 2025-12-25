import type { FastifyPluginAsync } from "fastify";

import useSymbols from "../database/symbols";
import useTrades from "../database/trades";
import useTradeService from "../services/trades";

import type { TradeWithOrders } from "../../../shared/trades.types";
import useLabels from "../database/labels";

const router: FastifyPluginAsync = async (server) => {
	const { getAllTrades, getTradeById, createTrade } = useTrades(server.prisma);
	const { deleteTradeFromLabel, updateLabel } = useLabels(server.prisma);
	const { getSymbolById } = useSymbols(server.prisma);

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
			return reply.send(404).send({ message: 'Trade not found!', });
		}
		return reply.code(200).send({ trade });
	});

	interface IPost { Body: TradeWithOrders; }
	server.post<IPost>('/', async (req, reply) => {
		let { target, stop, pnl, symbolId, orders } = req.body;

		if (!checkQuantities(orders)) {
			return reply.code(400).send({ message: 'Trade is open!' });
		}

		const symbol = await getSymbolById(Number(symbolId));
		if (symbol == null) {
			return reply.send(400).send({ message: 'Symbol not found!' });
		}

		orders = orders.map(o => ({
			...o,
			quantity: Number(o.quantity),
			date:     new Date(o.date),
			price:    Number(o.price),
		}));

		const trade: TradeWithOrders = {
			...req.body,
			target: target && Number(target),
			pnl: pnl && Number(pnl),
			stop: Number(stop),
			orders,
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
			return reply.send(404).send({ message: 'Trade not found!', });
		}

		await deleteTradeFromLabel(labelId, tradeId);
		return reply.code(201).send();
	});
};

export default router;