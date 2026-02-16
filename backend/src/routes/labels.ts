import type { FastifyPluginAsync } from "fastify";
import { Label, UpdateLabel } from "../../../shared/trades.types";
import useLabels from "../database/labels";
import { deleteLabelSchema, getLabelsSchema, patchLabelSchema, postLabelSchema } from "../schemas/labels";

const router: FastifyPluginAsync = async (server) => {
	const {
		getAllLabels,
		getLabelById,
		createLabel,
		updateLabel,
		deleteLabel,
	} = useLabels(server.prisma);

	server.get('/', getLabelsSchema, async (_req, reply) => {
		const labels = await getAllLabels();
		return reply.code(200).send({ labels });
	});

	interface Post { Body: Label }
	server.post<Post>('/', postLabelSchema, async (req, reply) => {
		try {
			const label = await createLabel(req.body);
			return reply.code(201).send({ label });
		} catch (err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface Patch { Params: { id: number; }; Body: UpdateLabel; }
	server.patch<Patch>('/:id', patchLabelSchema, async (req, reply) => {
		try {
			const id = Number(req.params.id);
			const curr = await getLabelById(id);

			const message = "Label not found!";
			if (curr == null) return reply.code(404).send({ message, });

			const label = await updateLabel(id, req.body);
			return reply.code(200).send({ label });
		} catch (err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface Delete { Params: { id: number; }; };
	server.delete<Delete>('/:id', deleteLabelSchema, async (req, reply) => {
		const id = Number(req.params.id);

		const label = await getLabelById(id);
		if (label == null) {
			return reply.code(404).send({ message: 'Label not found!', });
		}

		await deleteLabel(id);
		return reply.code(200).send({ message: 'Deleted' });
	});
};

export default router;