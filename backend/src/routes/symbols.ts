import type { FastifyPluginAsync } from "fastify";
import type { Symbol, UpdateSymbol } from "../../../shared/trades.types";
import useSymbols from "../database/symbols";
import {
	getSymbolSchema,
	getSymbolsSchema,
	patchSymbolSchema,
	postSymbolSchema,
	deleteSymbolSchema,
} from "../schemas/symbols";


const router: FastifyPluginAsync = async (server) => {
	const {
		getAllSymbols,
		getSymbolById,
		createSymbol,
		updateSymbol,
		deleteSymbol,
	} = useSymbols(server.prisma);

	server.get('/', getSymbolsSchema, async (_req, reply) => {
		const symbols = await getAllSymbols();
		return reply.code(200).send({ symbols });
	});

	interface IGet { Params: { id: number }; }
	server.get<IGet>('/:id', getSymbolSchema, async (req, reply) => {
		const id = Number(req.params.id);

		const symbol = await getSymbolById(id);
		if (symbol == null) {
			return reply.code(404).send({ message: 'Symbol not found!', });
		}
		return reply.code(200).send({ symbol });
	});

	interface IPost { Body: Symbol }
	server.post<IPost>('/', postSymbolSchema, async (req, reply) => {
		try {
			const symbol = await createSymbol(req.body);
			return reply.code(201).send({ symbol });
		} catch (err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface IPatch { Params: { id: number; }; Body: UpdateSymbol; }
	server.patch<IPatch>('/:id', patchSymbolSchema, async (req, reply) => {
		try {
			const id = Number(req.params.id);

			const curr = await getSymbolById(id);
			if (curr == null) return reply.code(404).send({ message: 'Symbol not found!', });

			const symbol = await updateSymbol(id, req.body);
			return reply.code(200).send({ symbol });
		} catch (err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface IDelete { Params: { id: number; } }
	server.delete<IDelete>('/:id', deleteSymbolSchema, async (req, reply) => {
		const id = Number(req.params.id);

		const symbol = await getSymbolById(id);
		if (symbol == null) {
			return reply.code(404).send({ message: 'Symbol not found!', });
		}

		await deleteSymbol(id);
		return reply.code(200).send({ message: 'Deleted' });
	});
};

export default router;