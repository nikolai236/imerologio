import { type PrismaClient } from "@prisma/client";
import type { 
	DbLabel,
	Label,
	LabelEntry,
	UpdateLabel
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
		const labels = await db.$queryRaw<DbLabel[]>`
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
		return ret as DbLabel;
	};

	const updateLabel = async (id: number, label: UpdateLabel) => {
		const { name, tradeId } = label;
		const data = {
			...(name != null ? { name } : undefined),
			...(tradeId != null ?
				{ trades: {
						create: [{
							trade: {
								connect: {
									id: tradeId,
									deleted: false
								}
							}
						}]
					}
				} :
				undefined
			),
		};

		const ret = await db.label.update({
			include, where: { id }, data,
		});
		return ret as DbLabel;
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
	};
};

export default useLabels;
