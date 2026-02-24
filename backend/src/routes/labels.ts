import type { FastifyPluginAsync } from "fastify";
import { Label, UpdateLabel } from "../../../shared/trades.types";
import useLabels from "../database/labels";
import useScoringService from "../services/scoring";
import {
	getLabelsSchema,
	postLabelSchema,
	patchLabelSchema,
	deleteLabelSchema,
	getLabelScoringSchema,
} from "../schemas/labels";

const router: FastifyPluginAsync = async (server) => {
	const {
		getAllLabels,
		getLabelById,
		createLabel,
		updateLabel,
		deleteLabel,
	} = useLabels(server.prisma);

	const getScores = useScoringService(server.prisma);

	interface Get { Querystring: { symbols?: boolean; } }
	server.get<Get>("/", getLabelsSchema, async (req, reply) => {
		const symbols = Boolean(req.query.symbols);
		const labels = await getAllLabels(symbols);
		return reply.code(200).send({ labels });
	});

	server.get("/scoring", getLabelScoringSchema, async (_req, reply) => {
		const {
			means: { muAll: mean, avgRR: RR },
			minSupport,
			tradeCount,
			levels
		} = await getScores();

		return reply.code(200).send({
			RR,
			mean,
			levels,
			minSupport,
			tradeCount,
		});
	});

	interface Post { Body: Label }
	server.post<Post>("/", postLabelSchema, async (req, reply) => {
		try {
			const label = await createLabel(req.body);
			return reply.code(201).send({ label });
		} catch (err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	interface Patch { Params: { id: number; }; Body: UpdateLabel; }
	server.patch<Patch>("/:id", patchLabelSchema, async (req, reply) => {
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
	server.delete<Delete>("/:id", deleteLabelSchema, async (req, reply) => {
		const id = Number(req.params.id);

		const label = await getLabelById(id);
		if (label == null) {
			return reply.code(404).send({ message: "Label not found!" });
		}

		await deleteLabel(id);
		return reply.code(200).send({ message: "Label deleted" });
	});
};

export default router;