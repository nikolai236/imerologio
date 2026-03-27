import type {
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
} from "fastify";

import type {
	DbJournalEntry,
	JournalEntry,
	JournalOrder,
	UpdateJournalEntry,
	UpdateJournalOrder
} from "../../../shared/journal.types";
import type { Timeframe } from "../../../shared/candles.types";

import { numberToTf, tfToNumber } from "../services/candles";
import {
	getJournalEntriesSchema,
	getJournalEntrySchema,
	patchJournalEntrySchema,
	postJournalEntrySchema
} from "../schemas/journal";

import journalRepository from "../database/journal";
import { validateOrderQuantities } from "../services/trades";

declare module "fastify" {
	interface FastifyRequest {
		journalEntry?: DbJournalEntry<Date, number>;
	}
}

const serialize = (
	{ charts, trades, ...entry }: DbJournalEntry<Date, number>
): DbJournalEntry<Date, Timeframe> => ({
	...entry,
	trades: trades.map(({ journalEntry, ...trade}) => trade),
	charts: charts.map(({ journalEntry, start, end, timeframe, ...chart }) => ({
		...chart,
		start: Number(start),
		end: Number(end),
		timeframe: numberToTf(timeframe),
	})),
});

const router: FastifyPluginAsync = async (server) => {
	const {
		getJournalEntries,
		getJournalEntry,
		createJounrnalEntry,
		updateJournalEntry,
	} = journalRepository(server.prisma);

	const loadJournalEntry = async (
		req: FastifyRequest<{ Params: { id: number; }; }>, 
		reply: FastifyReply,
	) => {
		const id = Number(req.params.id);
		const entry = await getJournalEntry(id);

		if (entry == null) {
			const message = "Journal entry not found";
			return reply.code(404).send({ message });
		}

		req.journalEntry = entry;
	};

	server.get("/", getJournalEntriesSchema, async (_req, reply) => {
		const entries = await getJournalEntries();
		// console.log(JSON.stringify(entries, null, 2))
		const serialized = entries.map(serialize);

		return reply.code(200).send(serialized);
	});

	interface Get { Params: { id: number; } }
	server.get<Get>(
		"/:id",
		{
			preHandler: loadJournalEntry,
			...getJournalEntrySchema,
		},
		async (req, reply) => {
			const serialized = serialize(req.journalEntry!);
			return reply.code(200).send(serialized);
		}
	);

	interface Post {
		Body: JournalEntry<string, Timeframe>
	}
	server.post<Post>("/", postJournalEntrySchema, async (req, reply) => {
		const { charts, ...parsed } = req.body;
		const entry: JournalEntry<string, number> = parsed;

		entry.trades ??= [];
		entry.charts = charts?.map(({ timeframe, ...chart }) => ({
			timeframe: tfToNumber(timeframe),
			...chart,
		})) ?? [];

		const areTradesClosed = entry.trades.every(({ orders }) =>
			validateOrderQuantities(orders)
		);

		if (!areTradesClosed) {
			const message = "Journal entry trades are open";
			return reply.code(400).send({ message });
		}

		try {
			const created = await createJounrnalEntry(entry);
			const serialized = serialize(created);
			return reply.code(200).send(serialized);

		} catch (err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface Patch {
		Params: { id: number; }
		Body: UpdateJournalEntry<string, Timeframe>;
	}
	server.patch<Patch>(
		"/:id",
		{
			preHandler: loadJournalEntry,
			...patchJournalEntrySchema,
		},
		async (req, reply) => {
			const { charts, ...parsed } = req.body;
			const entry: UpdateJournalEntry<string, number> = parsed;

			if (charts != null) {
				entry.charts = charts.map(({ timeframe, ...chart }) => ({
					...chart,
					...(timeframe != undefined && {
						timeframe: tfToNumber(timeframe)
					}),
				}));
			}

		const isFull = (order: UpdateJournalOrder<string>) =>
			order.type != null && order.quantity != null;

		const areTradesClosed = entry.trades == null || entry.trades.every(({ orders }) =>
			orders == null ||
			!orders.every(isFull) ||
			validateOrderQuantities(orders as JournalOrder<string>[])
		);

		if (!areTradesClosed) {
			const message = "Journal entry trades are open";
			return reply.code(400).send({ message });
		}

			try {

				const updated = await updateJournalEntry(
					req.journalEntry!.id, entry
				);
				const serialized = serialize(updated);
				return reply.code(200).send(serialized);

			} catch (err) {
				server.log.error(err);
				return reply.code(400).send({ message: err });
			}
		}
	);
};

export default router;