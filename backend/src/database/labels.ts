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
		const _count = { select: { trades: true, } };

		const res = await db.label.findMany({
			select: { id: true, name: true, _count },
		});

		return res.map(({ _count, ...rest }) => ({
			...rest, tradesCount: _count.trades ?? 0,
		})) as DbLabel[];
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
						trade: { connect: { id } },
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
						create: [{ trade: { connect: { id: tradeId } }}]
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
		const data = { trades: { deleteMany: { tradeId, labelId } } };

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
