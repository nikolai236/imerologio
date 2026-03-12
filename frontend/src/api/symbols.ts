import type {
	Symbol,
	DbSymbol,
	UpdateSymbol
} from '../../../shared/trades.types';
import api from './api';

const path = '/symbols';

export async function getSymbols() {
	const { symbols } = await api.get(path);

	return symbols as DbSymbol[];
};

export async function createSymbol(payload: Symbol){
	const { symbol } = await api.post(path, payload);

	return symbol as DbSymbol; 
};

export async function updateSymbol(id: number, payload: UpdateSymbol) {
	const { symbol } = await api.patch(
		path + `/${id}`, payload
	);

	return symbol as DbSymbol; 
};

export async function deleteSymbol(id: number) {
	await api.delete(path + `/${id}`);
};
