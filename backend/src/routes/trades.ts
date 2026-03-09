import type { FastifyPluginAsync } from "fastify";

import type {
	ApiTrade,
	Chart,
	ChartUnion,
	DbChart,
	Order,
	OrderUnion,
	Trade
} from "../../../shared/trades.types";
import { Timeframe } from "../../../shared/candles.types";

import useSymbols from "../database/symbols";
import useTrades from "../database/trades";
import useLabels from "../database/labels";

import {
	calculatePnL,
	parseOrders,
	validateOrderQuantities
} from "../services/trades";

import {
	getTradesSchema,
	getTradeSchema,
	postTradeSchema,
	patchTradeSchema,
	deleteLabelFromTradeSchema,
	deleteTradeSchema,
} from "../schemas/trades";
import { numberToTf, tfToNumber } from "../services/candles";

const router: FastifyPluginAsync = async (server) => {
	const {
		getAllTrades,
		getTradeById,
		createTrade,
		updateTrade,
		deleteTrade,
	} = useTrades(server.prisma);

	const { deleteTradeFromLabel, getLabelById } = useLabels(server.prisma);
	const { getSymbolById } = useSymbols(server.prisma);

	const convertCharts = (charts: DbChart<number>[]) => charts.map(c => ({
		...c, timeframe: numberToTf(c.timeframe),
	}));

	interface Get {
		Querystring: {
			from?: number;
			to?: number;
		};
	}
	server.get<Get>("/", getTradesSchema, async (req, reply) => {
		const from = req.query.to != null ? Number(req.query.from) : undefined;
		const to   = req.query.to != null ? Number(req.query.to  ) : undefined;

		const trades = await getAllTrades(undefined, from, to);

		for (const trade of trades) {
			if (trade.pnl != null) continue;
			trade.pnl = calculatePnL(trade.orders);
		}
		return reply.code(200).send({ trades });
	});

	interface Get { Params: { id: number } }
	server.get<Get>("/:id", getTradeSchema, async (req, reply) => {
		const id = Number(req.params.id);

		const trade = await getTradeById(id);
		if (trade == null) {
			return reply.code(404).send({ message: 'Trade not found!', });
		}

		const ret: ApiTrade = { ...trade, charts: convertCharts(trade.charts), };
		return reply.code(200).send({ trade: ret });
	});

	interface Post { Body: Trade<Chart<Timeframe>, Order<number>>; }
	server.post<Post>("/", postTradeSchema, async (req, reply) => {
		let { target, stop, pnl, symbolId, orders, charts } = req.body;

		if (!validateOrderQuantities(orders)) {
			return reply.code(400).send({ message: 'Trade is open!' });
		}

		const symbol = await getSymbolById(Number(symbolId));
		if (symbol == null) {
			return reply.code(404).send({ message: 'Symbol not found!' });
		}

		// see if it can be removed
		const transformedOrders = parseOrders(orders);

		const transformedCharts = charts.map(c => ({
			id: 'id' in c ? c.id : undefined,
			start: Number(c.start),
			end: Number(c.end),
			lines: c.lines,
			timeframe: tfToNumber(c.timeframe),
		}));

		const trade: Trade<Chart<number>, Order<Date>> = {
			...req.body,
			target: target && Number(target),
			pnl: pnl && Number(pnl),
			stop: Number(stop),
			orders: transformedOrders,
			charts: transformedCharts,
		};

		trade.pnl = trade.pnl ?? calculatePnL(trade.orders);

		try {
			const res = await createTrade(trade);
			const ret: ApiTrade = { ...res, charts: convertCharts(res.charts) };

			return reply.code(201).send({ trade: ret });
		} catch(err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface Patch {
		Params: { tradeId: number };
		Body: Partial<
			Trade<ChartUnion<Timeframe>, OrderUnion<number>>
		>;
	};
	server.patch<Patch>('/:tradeId', patchTradeSchema, async (req, reply) => {
		const id = Number(req.params.tradeId);
		const trade = await getTradeById(id);

		if (!trade) {
			const message = "Trade not found.";
			return reply.code(404).send({ message });
		}
		
		let { target, stop, orders, charts } = req.body;

		if (orders != null && !validateOrderQuantities(orders)) {
			const message = 'Invalid order quantities provided.';
			return reply.code(400).send({ message });
		}

		const transformedOrders = orders != null ?
			parseOrders(orders) : undefined;

		const transformedCharts = charts != null ? charts.map(c => ({
			start: Number(c.start),
			end: Number(c.end),
			timeframe: tfToNumber(c.timeframe),
			lines: c.lines,
			id: 'id' in c ? Number(c.id) : undefined,
		})) : undefined;

		const payload: Partial<Trade<ChartUnion<number>, OrderUnion<Date>>> = {
			...req.body,
			target: target != null ? Number(target) : target,
			stop: stop != null ? Number(stop) : stop,
			orders: transformedOrders,
			charts: transformedCharts,
		};

		payload.pnl = orders != null ?
			calculatePnL(payload.orders ?? trade.orders) : trade.pnl;

		try {
			const res = await updateTrade(id, payload);
			const ret: ApiTrade = { ...res, charts: convertCharts(res.charts) };

			return reply.code(200).send({ trade: ret });
		} catch(err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface Delete { Params: { id: number; }; }
	server.delete<Delete>("/:id", deleteTradeSchema, async (req, reply) => {
		const trade = await getTradeById(req.params.id);
		if (trade == null) {
			return reply.code(200).send({ message: "Trade not found" });
		}
		await deleteTrade(req.params.id);
		return reply.code(200).send({ message: "Trade deleted" });
	});

	interface DeleteLabel { Params: { tradeId: number; labelId: number }; };
	server.delete<DeleteLabel>(
		"/:tradeId/labels/:labelId",
		deleteLabelFromTradeSchema,
		async (req, reply) => {
			const tradeId = Number(req.params.tradeId);
			const labelId = Number(req.params.labelId);

			const trade = await getTradeById(tradeId);
			if (trade == null) {
				return reply.code(404).send({ message: "Trade not found!", });
			}

			const label = await getLabelById(labelId);
			if (label == null) {
				return reply.code(404).send({ message: "Label not found!", });
			}

			await deleteTradeFromLabel(labelId, tradeId);
			return reply.code(200).send({ message: "Label deleted from trade!" });
		}
	);
};

export default router;