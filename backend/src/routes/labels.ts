import type { FastifyPluginAsync } from "fastify";
import type {
	ApiScoringResponse,
	Label,
	UpdateLabel,
} from "../../../shared/trades.types";
import labelRepository from "../database/labels";
import scoringService from "../services/scoring";
import {
	getLabelsSchema,
	postLabelSchema,
	patchLabelSchema,
	deleteLabelSchema,
	getLabelScoringSchema,
	getLabelPerformance,
	removeChildSchema,
	addChildSchema,
	getLabelWithDescendatsSchema,
	getLabelAdjacencyListSchema,
} from "../schemas/labels";
import labelsPerformanceService from "../services/performance";

const parseIdArray = (ids?: string) =>
	ids?.split(",").map(Number) ?? [];

const router: FastifyPluginAsync = async (server) => {
	const {
		getAllLabels,
		getLabelById,
		createLabel,
		updateLabel,
		deleteLabel,
		getLabelDescendants,

		addChild,
		removeChild,
		getAdjacencyList,
	} = labelRepository(server.prisma);

	const getScores = scoringService(server.prisma);
	const getPerformance = labelsPerformanceService(server.prisma);

	interface Get { Querystring: { symbols?: boolean; } }
	server.get<Get>("/", getLabelsSchema, async (req, reply) => {
		const symbols = Boolean(req.query.symbols);
		const labels = await getAllLabels(symbols);
		return reply.code(200).send({ labels });
	});

	interface GetPerformance {
		Querystring: {
			includeIds?: string;
			excludeIds?: string;
		}
	}
	server.get<GetPerformance>(
		"/performance",
		getLabelPerformance,
		async (req, reply) => {
			const includeIds = parseIdArray(req.query.includeIds);
			const excludeIds = parseIdArray(req.query.excludeIds);

			if (includeIds.some(id => excludeIds.includes(id))) {
				const message = "Ids both included and excluded exist.";
				return reply.code(400).send({ message });
			}

			if ([...includeIds, ...excludeIds].some(isNaN)) {
				const message = "Invalid ids provided.";
				return reply.code(400).send({ message });
			}

			const performance = await getPerformance(includeIds, excludeIds);
			return reply.code(200).send(performance);
		}
	);

	interface GetScoring {
		Querystring: {
			filterBe?: boolean;
			beThreshold?: number;
		}
	}
	server.get<GetScoring>("/scoring", getLabelScoringSchema, async (req, reply) => {
		const filterBe = req.query.filterBe ?? false;
		const beThreshold = req.query.beThreshold ?? 0;

		if (filterBe && req.query.beThreshold == null) {
			return reply.code(400).send({
				message: "Please provide breakeven threshold",
			});
		}

		const {
			means: { muAll: mean, profitFactor, total, winRate },
			minSupport,
			tradeCount,
			levels,
		} = await getScores(filterBe, beThreshold);

		return reply.code(200).send({
			winRate,
			total,
			profitFactor,
			mean,
			levels,
			minSupport,
			tradeCount,
		} as ApiScoringResponse);
	});

	interface GetAdjacencyList { Params: { id: number } }
	server.get<GetAdjacencyList>(
		"/adjacency-list/:id",
		getLabelAdjacencyListSchema,
		async (req, reply) => {
			const rootId = Number(req.params.id);
			await getLabelById(rootId);

			const list = await getAdjacencyList(rootId);
			return reply.code(200).send(list);
		}
	);

	interface GetLabel { Params: { id: number } }
	server.get<GetLabel>(
		"/:id",
		getLabelWithDescendatsSchema,
		async (req, reply) => {
			const id = Number(req.params.id);
			const label = await getLabelDescendants(id);
			return reply.code(200).send(label);
		}
	);

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

	interface EditChildren { Params: { parentId: number; childId: number } }
	server.post<EditChildren>(
		"/children/:parentId/:childId",
		addChildSchema,
		async (req, reply) => {
			const parentId = Number(req.params.parentId);
			const childId = Number(req.params.childId);

			await addChild(parentId, childId);
			const label = await getLabelDescendants(parentId);

			return reply.code(201).send(label);
		}
	);

	interface Patch { Params: { id: number; }; Body: UpdateLabel; }
	server.patch<Patch>("/:id", patchLabelSchema, async (req, reply) => {
		try {
			const id = Number(req.params.id);
			await getLabelById(id);

			const label = await updateLabel(id, req.body);
			return reply.code(200).send({ label });
		} catch (err) {
			server.log.error(err);
			return reply.code(400).send({ message: err });
		}
	});

	server.delete<EditChildren>(
		"/children/:parentId/:childId",
		removeChildSchema,
		async (req, reply) => {
			const parentId = Number(req.params.parentId);
			const childId = Number(req.params.childId);

			await removeChild(parentId, childId);
			const label = await getLabelDescendants(parentId);

			return reply.code(200).send(label);
		}
	);

	interface Delete { Params: { id: number; }; };
	server.delete<Delete>("/:id", deleteLabelSchema, async (req, reply) => {
		const id = Number(req.params.id);

		await getLabelById(id);
		await deleteLabel(id);
		return reply.code(200).send({ message: "Label deleted" });
	});
};

export default router;