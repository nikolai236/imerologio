import type {
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest
} from "fastify";

import type {
	DbTrade,
	Trade,
	UpdateTrade
} from "../../../shared/trades.types";
import { Timeframe } from "../../../shared/candles.types";

import symbolRepository from "../database/symbols";
import tradeRepository from "../database/trades";
import labelRepository from "../database/labels";

import {
	calculatePnL,
	sanitizeTrade,
	serializeTrade,
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

declare module "fastify" {
	interface FastifyRequest {
		trade?: DbTrade<number, number>;
	}
}

function assertTradeLoaded(
	req: FastifyRequest
): asserts req is FastifyRequest & { trade: DbTrade<number, number> } {
	if (req.trade == null) {
		throw new Error("Trade not loaded!");
	}
}

const router: FastifyPluginAsync = async (server) => {
	const {
		getAllTrades,
		getTradeById,
		createTrade,
		updateTrade,
		deleteTrade,
	} = tradeRepository(server.prisma);

	const {
		deleteTradeFromLabel,
		getLabelById,
	} = labelRepository(server.prisma);

	const { getSymbolById } = symbolRepository(server.prisma);

	const loadTrade = async (
		req: FastifyRequest<{ Params: { id: number; } }>,
		reply: FastifyReply,
	) => {
		const id = Number(req.params.id);
		const trade = await getTradeById(id);

		if (trade == null) {
			const message = "Trade not found!";
			return reply.code(404).send({ message });
		}

		req.trade = trade;
	};

	interface Get {
		Querystring: {
			from?: number;
			to?: number;
		}
	}
	server.get<Get>("/", getTradesSchema, async (req, reply) => {
		const from = req.query.from != null
			? Number(req.query.from)
			: undefined;

		const to = req.query.to != null
			? Number(req.query.to)
			: undefined;

		const trades = await getAllTrades(undefined, from, to);

		for (const trade of trades) {
			if (trade.pnl != null) continue;
			trade.pnl = calculatePnL(trade.orders);
		}

		return reply.code(200).send(trades);
	});

	interface GetTrade { Params: { id: number } }
	server.get<GetTrade>(
		"/:id",
		{
			preHandler: loadTrade,
			...getTradeSchema,
		},
		async (req, reply) => {
			assertTradeLoaded(req);
			return reply.code(200).send(serializeTrade(req.trade));
		}
	);

	interface Post { Body: Trade<Timeframe, number>; }
	server.post<Post>("/", postTradeSchema, async (req, reply) => {

		if (!validateOrderQuantities(req.body.orders)) {
			const message = "Invalid order quantities provided.";
			return reply.code(400).send({ message });
		}

		const symbol = await getSymbolById(Number(req.body.symbolId));
		if (symbol == null) {
			const message = "Symbol not found!";
			return reply.code(404).send({ message });
		}

		const trade = sanitizeTrade(req.body);

		try {
			const res = await createTrade(trade);
			return reply.code(201).send(serializeTrade(res));
		} catch(err) {
			server.log.error(err);
			return reply.code(400).send({
				message: err instanceof Error
					? err.message
					: "Unknown error"
			});
		}
	});

	interface Patch {
		Params: { id: number };
		Body: UpdateTrade<Timeframe, number>;
	}
	server.patch<Patch>(
		"/:id",
		{
			preHandler: loadTrade,
			...patchTradeSchema
		},
		async (req, reply) => {
			assertTradeLoaded(req);

			if (
				req.body.orders != null &&
				!validateOrderQuantities(req.body.orders as any)
			) {
				const message = "Invalid order quantities provided.";
				return reply.code(400).send({ message });
			}

			const payload = sanitizeTrade(req.body);

			try {
				const res = await updateTrade(req.trade.id, payload);
				return reply.code(200).send(serializeTrade(res));
			} catch(err) {
				server.log.error(err);
				return reply.code(400).send({
					message: err instanceof Error
						? err.message
						: "Unknown error"
				});
			}
		}
	);

	interface Delete { Params: { id: number; } }
	server.delete<Delete>(
		"/:id",
		{
			preHandler: loadTrade,
			...deleteTradeSchema,
		},
		async (req, reply) => {
			assertTradeLoaded(req);
			await deleteTrade(req.trade.id);

			const message = "Trade deleted!";
			return reply.code(200).send({ message });
		}
	);

	interface DeleteLabel {
		Params: {
			id: number;
			labelId: number;
		}
	}
	server.delete<DeleteLabel>(
		"/:id/labels/:labelId",
		{
			preHandler: loadTrade,
			...deleteLabelFromTradeSchema
		},
		async (req, reply) => {
			assertTradeLoaded(req);
			const labelId = Number(req.params.labelId);

			const label = await getLabelById(labelId);
			if (label == null) {
				const message = "Label not found!";
				return reply.code(404).send({ message });
			}

			await deleteTradeFromLabel(labelId, req.trade.id);

			const message = "Label deleted from trade!";
			return reply.code(200).send({ message });
		},
	);
};

export default router;