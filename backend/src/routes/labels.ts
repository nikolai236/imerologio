import type { FastifyPluginAsync } from "fastify";
import { LabelWithId, LabelWithTradeIds, UpdateLabel } from "../../../shared/trades.types";
import useLabels from "../database/labels";

const router: FastifyPluginAsync = async (server) => {
	const {
		getAllLabels,
		getLabelById,
		createLabel,
		updateLabel,
		deleteLabel
	} = useLabels(server.prisma);

	server.get('/', async (_req, reply) => {
		const res = await getAllLabels();
		const labels: LabelWithId[] = res.map(l => ({
			...l,
			_count: undefined,
			tradesCount: l._count.trades ?? 0
		}));

		return reply.code(200).send({ labels });
	});

	interface IPost { Body: LabelWithTradeIds }
	server.post<IPost>('/', async (req, reply) => {
		try {
			const label = await createLabel(req.body);
			return reply.code(200).send({ label });
		} catch (err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface IPatch { Params: { id: number; }; Body: UpdateLabel; }
	server.patch<IPatch>('/:id', async (req, reply) => {
		try {
			const id = Number(req.params.id);

			const curr = await getLabelById(id);
			if (curr == null) return reply.code(404).send({ message: 'Label not found!', });

			const label = await updateLabel(id, req.body);
			return reply.code(200).send({ label });
		} catch (err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface IDelete { Params: { id: number; }; };
	server.delete<IDelete>('/:id', async (req, reply) => {
		const id = Number(req.params.id);

		const label = await getLabelById(id);
		if (label == null) {
			return reply.code(404).send({ message: 'Label not found!', });
		}

		await deleteLabel(id);
		return reply.code(201).send({ message: 'Deleted' });
	});
};

export default router;