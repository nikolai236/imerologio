import type { Prisma, PrismaClient } from '@prisma/client'
import { Symbol, UpdateSymbol } from '../../../shared/trades.types';

const useSymbols = (db: PrismaClient) => {
	const getAllSymbols = async () => {
		return await db.symbol.findMany();
	};

	const getSymbolById = async (id: number) => {
		return await db.symbol.findUnique({ where: { id }});
	};

	const createSymbol = async (symbol: Symbol) => {
		return await db.symbol.create({ data: symbol });
	};

	const updateSymbol = async (id: number, symbol: UpdateSymbol) => {
		return await db.symbol.update({
			where: { id },
			data: symbol as Prisma.SymbolUpdateInput
		});
	}

	const deleteSymbol = async (id: number) => {
		return await db.symbol.delete({ where: { id }});
	};

	return {
		getAllSymbols,
		getSymbolById,
		createSymbol,
		updateSymbol,
		deleteSymbol,
	};
};

export default useSymbols;