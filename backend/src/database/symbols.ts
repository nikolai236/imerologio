import type { Prisma, PrismaClient } from '@prisma/client'
import { DbSymbol, Symbol, UpdateSymbol } from '../../../shared/trades.types';

const useSymbols = (db: PrismaClient) => {
	const getAllSymbols = async () => {
		const symbols = await db.symbol.findMany();
		return symbols as DbSymbol[];
	};

	const getSymbolById = async (id: number) => {
		const symbol = await db.symbol.findUnique({ where: { id }});
		return symbol as DbSymbol;
	};

	const createSymbol = async (symbol: Symbol) => {
		const ret = await db.symbol.create({ data: symbol });
		return ret as DbSymbol;
	};

	const updateSymbol = async (id: number, symbol: UpdateSymbol) => {
		const ret = await db.symbol.update({
			where: { id },
			data: symbol as Prisma.SymbolUpdateInput
		});
		return ret as DbSymbol;
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