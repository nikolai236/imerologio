
import type {
	Chart,
	DbTradeEntry,
	Trade,
	DbOrder,
	OrderUnion,
	ChartUnion,
	ApiTrade
} from '../../../shared/trades.types';
import type { Timeframe } from "../../../shared/candles.types";

import api from "./api";

const assureIsDate = (o: DbOrder<Date>) =>{
	o.date = new Date(o.date);
};

const path = '/trades';

export async function getTrades(from?: number, to?: number) {
	const params = {
		...(from && { from }),
		...(to && { to }),
	};

	const trades = (await api.get(path, params)).trades as DbTradeEntry[];
	trades.forEach(({ orders }) => orders.forEach(assureIsDate));

	return trades;
};

export async function getTrade(id: number) {
	const { trade } = await api.get(path + `/${id}`);
	trade.orders.forEach(assureIsDate);

	return trade as ApiTrade;
};

type EditTradePayload = Partial<
	Trade<
		ChartUnion<Timeframe>,
		OrderUnion<number>
	>
>;

export async function editTrade(id: number,payload: EditTradePayload) {
	const { trade } = await api.patch(path + `/${id}`, payload);
	trade.orders.forEach(assureIsDate);

	return trade as ApiTrade;
};

export async function createTrade(payload: Trade<Chart<Timeframe>>) {
	const { trade } = await api.post(path, payload);
	trade.orders.forEach(assureIsDate);

	return trade as ApiTrade;
};

export async function deleteTrade(id: number) {
	try {
		await api.delete(path + `/${id}`);
	} catch(err) {
		console.error(err);
		return false;
	}
	return true;
};

