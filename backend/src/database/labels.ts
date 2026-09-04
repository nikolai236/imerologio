import { Prisma, type PrismaClient } from "@prisma/client";
import type { 
	DbLabelEntry,
	Label,
	LabelEntry,
	UpdateLabel,
	DbLabel,
} from "../../../shared/trades.types";

const labelRepository = (db: PrismaClient) => {
	const include = {
		trades: {
			include: {
				trade: true,
			}
		}
	} as const;

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

	// const getAllLabels = async (symbols = false) => {
	// 	const labels = await db.$queryRaw<DbLabelEntry[]>`
	// 		SELECT
	// 			l.id,
	// 			l.name,
	// 			COUNT(DISTINCT t.id)::int AS "tradeCount"
	// 		FROM "Label" l
	// 		LEFT JOIN "LabelClosure" lc
	// 			ON lc."ancestorId" = l.id
	// 		LEFT JOIN trade_labels tl
	// 			ON tl."labelId" = lc."descendantId"
	// 		LEFT JOIN "Trade" t
	// 			ON t.id = tl."tradeId"
	// 			AND t.deleted = false
	// 		WHERE ${symbols ? Prisma.sql`TRUE` : Prisma.sql`l."symbolId" IS NULL`}
	// 		GROUP BY l.id, l.name
	// 		ORDER BY l.name;
	// 	`;

	// 	return labels;
	// };

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


	// gate to all CRUD operations
	const getLabelById = async (id: number) => {
		const label = await db.label.findFirst({
			where: { id, symbolId: null }
		});
		return label as LabelEntry | null;
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
		}

		const ret = await db.label.create({ data, include });
		return ret as DbLabelEntry;
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
		return await db.label.delete({ where: { id } });
	};

	return {
		getAllLabels,
		getLabelById,
		createLabel,
		updateLabel,
		deleteTradeFromLabel,
		deleteLabel,
		getLabelsWithTradeIds,
	} as const;
};

export default labelRepository;
