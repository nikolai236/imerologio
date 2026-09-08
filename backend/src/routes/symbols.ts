import type { FastifyPluginAsync } from "fastify";
import type { Symbol, UpdateSymbol } from "../../../shared/trades.types";
import symbolRepository from "../database/symbols";
import {
	getSymbolSchema,
	getSymbolsSchema,
	patchSymbolSchema,
	postSymbolSchema,
	deleteSymbolSchema,
} from "../schemas/symbols";
import { NotFoundError, ValidationError } from "../errors";

const router: FastifyPluginAsync = async (server) => {
	const {
		getAllSymbols,
		getSymbolById,
		createSymbol,
		updateSymbol,
		deleteSymbol,
	} = symbolRepository(server.prisma);

	server.get("/", getSymbolsSchema, async (_req, reply) => {
		const symbols = await getAllSymbols();
		return reply.code(200).send({ symbols });
	});

	interface Get { Params: { id: number }; }
	server.get<Get>("/:id", getSymbolSchema, async (req, reply) => {
		const id = Number(req.params.id);
		const symbol = await getSymbolById(id);

		if (symbol == null) {
			throw new NotFoundError("Symbol not found!");
		}
		return reply.code(200).send({ symbol });
	});

	interface Post { Body: Symbol }
	server.post<Post>("/", postSymbolSchema, async (req, reply) => {
		try {
			const symbol = await createSymbol(req.body);
			return reply.code(201).send({ symbol });
		} catch (err) {
			server.log.error(err);
			throw new ValidationError(String(err));
		}
	});

	interface Patch { Params: { id: number; }; Body: UpdateSymbol; }
	server.patch<Patch>("/:id", patchSymbolSchema, async (req, reply) => {
		try {
			const id = Number(req.params.id);
			const curr = await getSymbolById(id);

			if (curr == null) {
				throw new NotFoundError("Symbol not found!");
			}
			const symbol = await updateSymbol(id, req.body);
			return reply.code(200).send({ symbol });
		} catch (err) {
			server.log.error(err);
			throw new ValidationError(String(err));
		}
	});

	interface Delete { Params: { id: number; } }
	server.delete<Delete>("/:id", deleteSymbolSchema, async (req, reply) => {
		const id = Number(req.params.id);

		const symbol = await getSymbolById(id);
		if (symbol == null) {
			throw new NotFoundError("Symbol not found!");
		}

		await deleteSymbol(id);
		return reply.code(200).send({ message: "Deleted" });
	});
};

export default router;