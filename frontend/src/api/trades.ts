
import type {
	DbTradeEntry,
	Trade,
	DbOrder,
	ApiTrade,
	UpdateTrade
} from '../../../shared/trades.types';
import type { Timeframe } from "../../../shared/candles.types";

import api from "./api";

const assureIsDate = (o: DbOrder<Date>) => {
	o.date = new Date(o.date);
};

const path = "/trades";

export async function getTrades(
	from?: number, to?: number
) {
	const trades = await api.get(path, {
		...(from && { from }),
		...(to && { to }),
	});

	trades.forEach(({ orders }: any) =>
		orders.forEach(assureIsDate)
	);

	return trades as DbTradeEntry<Date>[];
};

export async function getTrade(id: number) {
	const trade = await api.get(`${path}/${id}`);
	trade.orders.forEach(assureIsDate);
	return trade as ApiTrade;
};

export async function editTrade(
	id: number,
	payload: UpdateTrade<Timeframe, number>
) {
	const trade = await api.patch(`${path}/${id}`, payload);
	trade.orders.forEach(assureIsDate);

	return trade as ApiTrade;
};

export async function createTrade(payload: Trade<Timeframe, number>) {
	const trade = await api.post(path, payload);
	trade.orders.forEach(assureIsDate);

	return trade as ApiTrade;
};

export async function deleteTrade(id: number) {
	try {
		await api.delete(`${path}/${id}`);
	} catch(err) {
		console.error(err);
		return false;
	}
	return true;
};

