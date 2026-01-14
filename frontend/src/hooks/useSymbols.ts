import useApi from "./useApi";

import { type Symbol, type DbSymbol, type UpdateSymbol } from '../../../shared/trades.types';

const useSymbols = () => {
	const api = useApi();
	const path = '/symbols';

	const getSymbols = async () => {
		const { symbols } = await api.get(path);
		return symbols as DbSymbol[];
	};

	const createSymbol = async (payload: Symbol) => {
		const { symbol } = await api.post(path,  payload);
		return symbol as DbSymbol; 
	};

	const updateSymbol = async (id: number, payload: UpdateSymbol) => {
		const { symbol } = await api.patch(path + `/${id}`, payload);
		return symbol as DbSymbol; 
	};

	const deleteSymbol = async (id: number) => {
		await api.delete(path + `/${id}`);
	};

	return {
		getSymbols,
		createSymbol,
		updateSymbol,
		deleteSymbol,
	};
};

export default useSymbols;