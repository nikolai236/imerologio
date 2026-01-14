import type { FastifyPluginAsync } from "fastify";

import type { ApiTrade, Chart, ChartUnion, DbChart, DbTrade, Order, OrderUnion, Trade } from "../../../shared/trades.types";
import { Timeframe } from "../../../shared/candles.types";

import useSymbols from "../database/symbols";
import useTrades from "../database/trades";
import useLabels from "../database/labels";

import useTradeService from "../services/trades";
import useCandleService from "../services/candles";

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
			.forEach((t) => { t.pnl = calculatePnL(t.orders); });

		return reply.code(200).send({ trades });
	});

	interface IGet { Params: { id: number } }
	server.get<IGet>('/:id', async (req, reply) => {
		const id = Number(req.params.id);

		const trade = await getTradeById(id);
		if (trade == null) {
			return reply.code(404).send({ message: 'Trade not found!', });
		}

		const convertCharts = (charts: DbChart<number>[]) => charts.map(c => ({
			...c, timeframe: numberToTf(c.timeframe),
		}));

		const ret: ApiTrade = { ...trade, charts: convertCharts(trade.charts), };
		return reply.code(200).send({ trade: ret });
	});

	interface IPost { Body: Trade<Chart<Timeframe>, Order<number>>; }
	server.post<IPost>('/', async (req, reply) => {
		let { target, stop, pnl, symbolId, orders, charts } = req.body;

		if (!validateOrderQuantities(orders)) {
			return reply.code(400).send({ message: 'Trade is open!' });
		}

		const symbol = await getSymbolById(Number(symbolId));
		if (symbol == null) {
			return reply.code(400).send({ message: 'Symbol not found!' });
		}

		const transformedOrders = parseOrders(orders);

		const transformedCharts = charts.map(c => ({
			id: 'id' in c ? c.id : undefined,
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

		const trade: Trade<Chart<number>, Order<Date>> = {
			...req.body,
			target: target && Number(target),
			pnl: pnl && Number(pnl),
			stop: Number(stop),
			orders: transformedOrders,
			charts: transformedCharts,
		};

		trade.pnl = trade.pnl ?? calculatePnL(trade.orders);

		const convertCharts = (charts: DbChart<number>[]) => charts.map(c => ({
			...c, timeframe: numberToTf(c.timeframe),
		}));

		try {

			const res = await createTrade(trade);
			const ret: ApiTrade = { ...res, charts: convertCharts(res.charts) };

			return reply.code(200).send({ trade: ret });
		} catch(err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface IPatch {
		Params: { tradeId: number };
		Body: Partial<
			Trade<ChartUnion<Timeframe>, OrderUnion<number>>
		>;
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

		const transformedOrders = orders != null ?
			parseOrders(orders) : undefined;

		const transformedCharts = charts != null ? charts.map(c => ({
			start: Number(c.start),
			end: Number(c.end),
			timeframe: tfToNumber(c.timeframe),
			id: 'id' in c ? Number(c.id) : undefined,
		})) : undefined;

		const badCharts = transformedCharts && transformedCharts.some(
			c => [c.start, c.end, c.timeframe].some(isNaN)
		);
		if (badCharts) {
			const message = "Bad charts provided";
			return reply.code(400).send({ message });
		}

		const payload: Partial<Trade<ChartUnion<number>, OrderUnion<Date>>> = {
			...req.body,
			target: target != null ? Number(target) : target,
			stop: stop != null ? Number(stop) : stop,
			orders: transformedOrders,
			charts: transformedCharts,
		};

		payload.pnl = orders != null ?
			calculatePnL(payload.orders ?? trade.orders) :
			trade.pnl;

		const convertCharts = (charts: DbChart<number>[]) => charts.map(c => ({
			...c, timeframe: numberToTf(c.timeframe),
		}));

		try {
			const res = await updateTrade(id, payload);
			const ret: ApiTrade = { ...res, charts: convertCharts(res.charts) };

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