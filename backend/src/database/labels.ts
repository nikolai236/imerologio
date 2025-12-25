import { type PrismaClient } from "@prisma/client";
import type { LabelWithTradeIds, UpdateLabel } from "../../../shared/trades.types";

const useLabels = (db: PrismaClient) => {
	const getAllLabels = async () => {
		const _count = { select: { trades: true, } };

		return await db.label.findMany({
			select: { id: true, name: true, _count },
		});
	};

	const getLabelById = async (id: number) => {
		return await db.label.findUnique({ where: { id } });
	};

	const createLabel = async (label: LabelWithTradeIds) => {
		const trades = { connect: label.tradeIds.map(id => ({ id })) };

		return await db.label.create({
			data: { name: label.name, trades },
			include: { trades: { select: { id: true } } },
		});
	};

	const updateLabel = async (id: number, label: UpdateLabel) => {
		const data = {
			name: label.name,
			trades: label.tradeId == undefined ? undefined : {
				connect: [{ id: label.tradeId }],
			},
		};

		return await db.label.update({
			include: { trades: { select: { id: true } } },
			where: { id },
			data,
		});
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
