import { type PrismaClient } from "@prisma/client";
import type { DbLabel, Label, LabelEntry, UpdateLabel } from "../../../shared/trades.types";

const useLabels = (db: PrismaClient) => {
	const getAllLabels = async () => {
		const _count = { select: { trades: true, } };

		const res = await db.label.findMany({
			select: { id: true, name: true, _count },
		});

		const labels: DbLabel[] = res.map(l => ({
			...l,
			_count: undefined,
			tradesCount: l._count.trades ?? 0,
		}));

		return labels;
	};

	const getLabelById = async (id: number) => {
		const label = await db.label.findUnique({ where: { id } });
		return label as LabelEntry | null;
	};

	const createLabel = async (label: Label) => {
		const trades = { connect: label.tradeIds.map(id => ({ id })) };

		const ret = await db.label.create({
			data: { name: label.name, trades },
			include: { trades: { select: { id: true } } },
		});
		return ret as DbLabel;
	};

	const updateLabel = async (id: number, label: UpdateLabel) => {
		const data = {
			name: label.name,
			trades: label.tradeId == undefined ? undefined : {
				connect: [{ id: label.tradeId }],
			},
		};

		const ret = await db.label.update({
			include: { trades: { select: { id: true } } },
			where: { id },
			data,
		});
		return ret as DbLabel;
	};

	const deleteTradeFromLabel = async (labelId: number, tradeId: number) => {
		return await db.label.update({
			include: { trades: { select: { id: true } } },
			where: { id: labelId },
			data: { trades: { disconnect: [{ id: tradeId }] } },
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
		deleteLabel
	};
};

export default useLabels;
