import { Prisma, type PrismaClient } from "@prisma/client";
import type { 
	LabelTrades,
	DbLabelEntry,
	Label,
	LabelEntry,
	UpdateLabel,
	DbLabel,
} from "../../../shared/trades.types";

const useLabels = (db: PrismaClient) => {
	const include = {
		trades: {
			include: {
				trade: true,
			}
		}
	} as const;

	const getAllLabels = async () => {
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
			GROUP BY l.id, l.name
			ORDER BY l.name;
		`;
		return labels;
	};

	const getLabelsWithTradeIds = async () => {
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
			GROUP BY l.id, l.name
			ORDER BY l.id
		`;
		return labels;
	};

	const getLabelsWithTrades = async (ids?: number[]) => {
		const whereClause = ids != null ?
			Prisma.sql`WHERE l.id=ANY(${ids}::int[])` :
			Prisma.empty;

		const labels = await db.$queryRaw<LabelTrades[]>`
			SELECT
				l.id,
				l.name,
				COALESCE(
					jsonb_agg(
						jsonb_build_object(
							'id', t.id,
							'target', t.target,
							'stop', t.stop,
							'pnl', t.pnl,
							'description', t.description,
							'symbolId', t."symbolId",
							'symbol', jsonb_build_object(
								'id', s.id,
								'name', s.name,
								'type', s.type,
								'description', s.description
							),
							'orders',
								COALESCE((
									SELECT jsonb_agg(
										jsonb_build_object(
											'id', o.id,
											'quantity', o.quantity,
											'date', o.date,
											'price', o.price,
											'type', o.type,
											'tradeId', o."tradeId"
										)
										ORDER BY o.date ASC
									)
									FROM "Order" o
									WHERE o."tradeId" = t.id
								), '[]'::jsonb)
						)
					) FILTER (WHERE t.id IS NOT NULL),
					'[]'::jsonb
				) AS trades
			FROM "Label" l
			LEFT JOIN trade_labels tl
				ON tl."labelId" = l.id
			LEFT JOIN "Trade" t
				ON t.id = tl."tradeId"
				AND t.deleted = false
			LEFT JOIN "Symbol" s
				ON s.id = t."symbolId"
			${whereClause}
			GROUP BY l.id, l.name
			ORDER BY l.name
		`;

		return labels;
	};

	const getLabelById = async (id: number) => {
		const label = await db.label.findUnique({
			where: { id }
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
		getLabelsWithTrades,
	};
};

export default useLabels;
