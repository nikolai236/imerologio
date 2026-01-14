import useApi from "./useApi";

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

const useTrades = () => {
	const api = useApi();
	const path = '/trades';

	const _assureIsDate = (o: DbOrder<Date>) =>{
		o.date = new Date(o.date);
	};

	const getTrades = async () => {
		const { trades } = await api.get(path) as { trades: DbTradeEntry[] };
		trades.forEach(({ orders }) => orders.forEach(_assureIsDate));
		return trades;
	};

	const getTrade = async (id: number) => {
		const { trade } = await api.get(path + `/${id}`);
		trade.orders.forEach(_assureIsDate);
		return trade as ApiTrade;
	};

	const editTrade = async (id: number, paylaod: Partial<Trade<ChartUnion<Timeframe>, OrderUnion<number>>>) => {
		const { trade } = await api.patch(path + `/${id}`, paylaod);
		trade.orders.forEach(_assureIsDate);
		return trade as ApiTrade;
	};

	const createTrade = async (payload: Trade<Chart<Timeframe>>) => {
		const { trade } = await api.post(path, payload);
		trade.orders.forEach(_assureIsDate);
		return trade as ApiTrade;
	};

	return {
		getTrade,
		getTrades,
		createTrade,
		editTrade,
	};
};

export default useTrades;