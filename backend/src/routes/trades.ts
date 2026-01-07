import type { FastifyPluginAsync } from "fastify";

import useSymbols from "../database/symbols";
import useTrades from "../database/trades";
import useTradeService from "../services/trades";

import type { Chart, ChartWithId, Order, TradeWithOrders } from "../../../shared/trades.types";
import useLabels from "../database/labels";
import useCandleService from "../services/candles";
import { Timeframe } from "../../../shared/candles.types";

const router: FastifyPluginAsync = async (server) => {
	const {
		getAllTrades,
		getTradeById,
		createTrade,
		updateTrade
	} = useTrades(server.prisma);

	const { deleteTradeFromLabel } = useLabels(server.prisma);
	const { getSymbolById } = useSymbols(server.prisma);

	const { tfToNumber, numberToTf } = useCandleService();
	const {
		calculatePnL,
		validateOrderQuantities,
		parseOrders
	} = useTradeService();

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

		trade.charts = trade.charts.map(c => ({
			...c, timeframe: numberToTf(c.timeframe),
		}));

		return reply.code(200).send({ trade });
	});

	interface IPost { Body: TradeWithOrders<Chart<Timeframe>>; }
	server.post<IPost>('/', async (req, reply) => {
		let { target, stop, pnl, symbolId, orders, charts } = req.body;

		if (!validateOrderQuantities(orders)) {
			return reply.code(400).send({ message: 'Trade is open!' });
		}

		const symbol = await getSymbolById(Number(symbolId));
		if (symbol == null) {
			return reply.code(400).send({ message: 'Symbol not found!' });
		}

		orders = parseOrders(orders);

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

	interface IPatch {
		Params: { tradeId: number };
		Body: Partial<TradeWithOrders<
			ChartWithId<Timeframe>,
			Order & { id?: number }
		>>;
	};
	server.patch<IPatch>('/:tradeId', async (req, reply) => {
		const id = Number(req.params.tradeId);
		const trade = await getTradeById(id);

		if (!trade) {
			const message = "Trade not found.";
			return reply.code(404).send({ message });
		}

		let { target, stop, orders, charts } = req.body;

		if (orders != null && !validateOrderQuantities(orders)) {
			return reply.code(400).send({ message: 'Invalid order quantities provided.' });
		}

		if (orders != null) orders = parseOrders(orders);

		const transformedCharts = charts != null ? charts.map(c => ({
			start: Number(c.start),
			end: Number(c.end),
			timeframe: tfToNumber(c.timeframe),
			id: c.id != null ? Number(c.id) : undefined,
		})) : undefined;

		const badCharts = transformedCharts && transformedCharts.some(
			c => [c.start, c.end, c.timeframe].some(isNaN)
		);
		if (badCharts) {
			const message = "Bad charts provided";
			return reply.code(400).send({ message });
		}

		const payload: Partial<TradeWithOrders<(Chart & {id?: number}), (Order & {id?: number})>> = {
			...req.body,
			target: target != null ? Number(target) : target,
			stop: stop != null ? Number(stop) : stop,
			orders,
			charts: transformedCharts,
		};

		payload.pnl = calculatePnL({
			...trade, ...payload
		});

		try {
			const ret = await updateTrade(id, trade, payload);
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
		return reply.code(201).send({ message: 'Label deleted from trade!' });
	});
};

export default router;