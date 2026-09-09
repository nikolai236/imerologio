import { Prisma, type PrismaClient } from "@prisma/client";
import type { 
	DbLabelEntry,
	Label,
	LabelEntry,
	UpdateLabel,
	DbLabel,
	DbLabelWithDescendats,
} from "../../../shared/trades.types";
import { NotFoundError, ValidationError } from "../errors";

const LABEL_HIERARCHY_LOCK = 827361;

const labelRepository = (db: PrismaClient) => {
	const include = {
		trades: {
			include: {
				trade: true,
			}
		}
	} as const;

	const lockLabelHierarchy = async (
		tx: Prisma.TransactionClient,
	) => {
		await tx.$executeRaw`
			SELECT pg_advisory_xact_lock(${LABEL_HIERARCHY_LOCK})
		`;
	};

	const getAllLabels = async (symbols=false) => {
		const whereClause = symbols ?
			Prisma.empty :
			Prisma.sql`WHERE l."symbolId" IS NULL`;

		const labels = await db.$queryRaw<DbLabelEntry[]>`
			SELECT
				l.id,
				l.name,
				COUNT(t.id) AS "tradeCount"
			FROM "Label" l
			LEFT JOIN trade_labels tl
				ON tl."labelId" = l.id
			LEFT JOIN "Trade" t
				ON t.id = tl."tradeId"
				AND t.deleted = false
			${whereClause}
			GROUP BY l.id, l.name
			ORDER BY l.name;
		`;
		return labels;
	};

	const getLabelsWithTradeIds = async (allowSymbolLabels=false) => {
		const whereClause = allowSymbolLabels ?
			Prisma.empty :
			Prisma.sql`WHERE l."symbolId" IS NULL`;

		const labels = await db.$queryRaw<DbLabel[]>`
			SELECT
				l.id,
				l.name,
				COALESCE(
					array_agg(
						tl."tradeId"
					) FILTER (WHERE t.id IS NOT NULL),
					'{}'
				) AS "tradeIds"
			FROM "Label" l
			LEFT JOIN trade_labels tl
				ON l.id = tl."labelId"
			LEFT JOIN "Trade" t
				ON t.id = tl."tradeId"
				AND t.deleted = false
			${whereClause}
			GROUP BY l.id, l.name
			ORDER BY l.id
		`;
		return labels;
	};

	const getLabelDescendants = async (id: number) => {
		// const label = await db.label.findFirst({
		// 	where: {
		// 		id,
		// 		symbolId: null,
		// 	},
		// 	include: {
		// 		descendantPaths: {
		// 			include: {
		// 				descendant: true,
		// 			},
		// 		},
		// 	},
		// });

		const [label] = await db.$queryRaw<any>`
			SELECT
				l.id,
				l.name,
				l."symbolId",
				COALESCE(
					json_agg(
						json_build_object(
							'id', c.id,
							'name', c.name,
							'symbolId', c."symbolId"
						)
					) FILTER (WHERE c.id IS NOT NULL),
					'[]'
				) AS descendants
			FROM "Label" l
			LEFT JOIN "LabelClosure" e
				ON e."ancestorId" = l.id
			LEFT JOIN "Label" c
				ON c.id = e."descendantId"
			WHERE
				l.id = ${id}
				AND l."symbolId" IS NULL
			GROUP BY l.id, l.name, l."symbolId";`;

		if (label == null) {
			throw new NotFoundError("Label not found");
		}
		return label as DbLabelWithDescendats;

		// // @ts-ignore
		// const { descendantPaths, ...rest } = label;
		// return {
		// 	...rest,
		// // @ts-ignore
		// 	children: descendantPaths.map(d => d.descendant),
		// } as DbLabelWithChildren;
	};

	const getAdjacencyList = async (rootId: number) => {
		const getDescendants = async () => db.labelClosure.findMany({
			where: { ancestorId: rootId },
			select: { descendantId: true },
		});

		const descendantIds = (await getDescendants())
			.map(d => d.descendantId);

		const edges = await db.labelEdge.findMany({
			where: {
				parentId: {
					in: descendantIds
				},
			},
		});

		const list: Record<number, number[]> = {};
		for (const id of descendantIds) {
			list[id] = [];
		}

		for (const { parentId, childId } of edges) {
			list[parentId].push(childId);
		}

		return list;
	};

	const getAncestorsList = async () => {
		const closures = await db.labelClosure.findMany({
			where: {
				NOT: {
					ancestorId: {
						equals: db.labelClosure.fields.descendantId,
					}
				}
			},
			select: {
				ancestorId: true,
				descendantId: true
			}
		});

		const ancestorsList: Record<number, number[]> = {}
		for (const { ancestorId, descendantId } of closures) {
			ancestorsList[ancestorId] = [];
			ancestorsList[descendantId] = [];
		}

		for (const { ancestorId, descendantId } of closures) {
			ancestorsList[descendantId].push(ancestorId);
		}

		return ancestorsList;
	};

	// gate to all CRUD operations
	const getLabelById = async (id: number) => {
		const label = await db.label.findFirst({
			where: { id, symbolId: null }
		});
		if (label == null) {
			throw new NotFoundError("Label with id " + id + " not found");
		}
		return label as LabelEntry;
	};

	const createLabel = async (label: Label) => {
		const { name, tradeIds } = label;

		const data = {
			name,
			...(tradeIds != null ? {
				trades: {
					create: tradeIds.map((id) => ({
						trade: { connect: { id, deleted: false } },
					})),
				}
			} : undefined),
		};

		return db.$transaction(async tx => {
			await lockLabelHierarchy(tx);

			const label = await tx.label.create({ data, include });
			await tx.labelClosure.create({
				data: {
					ancestorId: label.id,
					descendantId: label.id,
				}
			});
			return label as DbLabelEntry;
		});
	};

	const updateLabel = async (id: number, label: UpdateLabel) => {
		const { name, tradeId } = label;
		const data = {
			...(name != null ? { name } : undefined),
			...(tradeId != null ? {
				trades: {
						create: [{
							trade: {
								connect: {
									id: tradeId,
									deleted: false
								}
							}
						}]
					}
				} : undefined),
		};

		const ret = await db.label.update({
			include, where: { id }, data,
		});
		return ret as DbLabelEntry;
	};

	const deleteTradeFromLabel = async (
		labelId: number,
		tradeId: number
	) => {
		const data = {
			trades: {
				deleteMany: {
					tradeId,
					labelId,
					deleted: false,
				}
			}
		};

		return await db.label.update({
			include, where: { id: labelId }, data,
		});
	};

	const deleteLabel = async (id: number) => {
		return db.$transaction(async tx => {
			await lockLabelHierarchy(tx);

			const getAnscestors = async () => tx.labelClosure.findMany({
				where: { descendantId: id, ancestorId: { not: id } },
				select: { ancestorId: true },
			});

			const getDescendants = async () => tx.labelClosure.findMany({
				where: { ancestorId: id, descendantId: { not: id } },
				select: { descendantId: true },
			});

			const deleteLabel = async () => tx.label.delete({ where: { id }});

			const [ancestors, descendants, deleted] = await Promise.all([
				getAnscestors(), getDescendants(), deleteLabel()
			]);

			const ancIds = ancestors.map(a => a.ancestorId);
			const descIds = descendants.map(d => d.descendantId);
			if (ancIds.length == 0 || descIds.length == 0) return deleted;

			await tx.$executeRaw`
				WITH RECURSIVE reachable("ancestorId", "descendantId") AS (
					SELECT
						a.id,
						a.id
					FROM unnest(${ancIds}::int[]) AS a(id)

					UNION

					SELECT
						r."ancestorId"
						e."childId"
					FROM reachable r
					JOIN "LabelEdge" e
						ON e."parentId" = r."descendantId"
				)

				DELETE FROM "LabelClosure" lc
					WHERE
						lc."ancestorId" = ANY(${ancIds}::int[])
						AND lc."descendantId" = ANY(${descIds}::int[])
						AND NOT EXISTS (
							SELECT 1
							FROM reachable r
							WHERE
								r."ancestorId" = lc."ancestorId"
								AND r."descendantId" = lc."descendantId"
						)
			`;

			return deleted;
		});
	};

	const addChild = async (parentId: number, childId: number) => {
		if (parentId === childId) {
			throw new ValidationError("Parent id and child id cannot match");
		}

		await Promise.all([
			getLabelById(parentId), getLabelById(childId)
		]);

		await db.$transaction(async (tx) => {
			await lockLabelHierarchy(tx);

			const createsCycle = await tx.labelClosure.findUnique({
				where: {
					ancestorId_descendantId: {
						ancestorId: childId,
						descendantId: parentId,
					},
				},
			});

			if (createsCycle) {
				throw new ValidationError("Adding this edge will create a cycle");
			}

			const edgeExists = await tx.labelEdge.findUnique({
				where: {
					parentId_childId: {
						parentId, childId,
					},
				},
			});

			if (edgeExists) {
				throw new ValidationError("Edge already exists");
			}

			const createEdge = async () => tx.labelEdge.create({
				data: { parentId, childId },
			});

			const getAnscestors = async () => tx.labelClosure.findMany({
				where: { descendantId: parentId },
				select: { ancestorId: true },
			});

			const getDescendants = async () => tx.labelClosure.findMany({
				where: { ancestorId: childId },
				select: { descendantId: true },
			});

			const [ancestors, descendants, _] = await Promise.all([
				getAnscestors(), getDescendants(), createEdge(),
			]);

			await tx.labelClosure.createMany({
				data: ancestors.flatMap(({ ancestorId }) =>
					descendants.map(({ descendantId }) => ({
						ancestorId,
						descendantId,
					})),
				),
				skipDuplicates: true,
			});
		});
	};

	const removeChild = async (
		parentId: number,
		childId: number,
	) => {
		if (parentId === childId) {
			throw new ValidationError("Parent id and child id cannot match");
		}

		await Promise.all([
			getLabelById(parentId), getLabelById(childId)
		]);

		await db.$transaction(async (tx) => {
			await lockLabelHierarchy(tx);

			const edge = await tx.labelEdge.findUnique({
				where: {
					parentId_childId: {
						parentId,
						childId,
					},
				},
			});

			if (!edge) {
				throw new NotFoundError("Child relation not found");
			}

			const getAnscestors = async () => tx.labelClosure.findMany({
				where: { descendantId: parentId },
				select: { ancestorId: true },
			});

			const getDescendants = async () => tx.labelClosure.findMany({
				where: { ancestorId: childId },
				select: { descendantId: true },
			});

			const deleteEdge = async () => tx.labelEdge.delete({
				where: {
					parentId_childId: {
						parentId,
						childId,
					},
				},
			});

			const [ancestors, descendants] = await Promise.all([
				getAnscestors(), getDescendants(), deleteEdge()
			]);

			const ancIds = ancestors.map(a => a.ancestorId);
			const descIds = descendants.map(d => d.descendantId);

			await tx.$executeRaw`
				WITH RECURSIVE reachable("ancestorId", "descendantId") AS (
					SELECT
						a.id,
						a.id
					FROM unnest(${ancIds}::int[]) AS a(id)

					UNION

					SELECT
						r."ancestorId",
						e."childId"
					FROM reachable r
					JOIN "LabelEdge" e
						ON e."parentId" = r."descendantId"
				)

				DELETE FROM "LabelClosure" lc
				WHERE
					lc."ancestorId" = ANY(${ancIds}::int[])
					AND lc."descendantId" = ANY(${descIds}::int[])
					AND NOT EXISTS (
						SELECT 1
						FROM reachable r
						WHERE
							r."ancestorId" = lc."ancestorId"
							AND r."descendantId" = lc."descendantId"			
					)
			`;
		});
	};

	return {
		getAllLabels,
		getLabelById,
		createLabel,
		updateLabel,
		deleteTradeFromLabel,
		deleteLabel,
		getLabelsWithTradeIds,
		getLabelDescendants,

		addChild,
		removeChild,

		getAncestorsList,
		getAdjacencyList,
	} as const;
};

export default labelRepository;