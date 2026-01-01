import useApi from "./useApi";

import { type Order, type TradeFullWithId, type TradeWithId, type TradeWithOrders } from '../../../shared/trades.types';
import type { ChartStringTf } from "../../../shared/candles.types";

const useTrades = () => {
  const api = useApi();
  const path = '/trades';

  const _assureIsDate = (o: Order) => o.date = new Date(o.date);

  const getTrades = async () => {
    const { trades } = await api.get(path) as { trades: TradeWithId[] };
    trades.forEach(({ orders }) => orders.forEach(_assureIsDate));
    return trades;
  };

  const getTrade = async (id: number) => {
    const { trade } = await api.get(path + `/${id}`);
    trade.orders.forEach(_assureIsDate);
    return trade as TradeFullWithId;
  };

  const createTrade = async (payload: TradeWithOrders<ChartStringTf>) => {
    const { trade } = await api.post(path, payload);
    trade.orders.forEach(_assureIsDate);
    return trade as TradeFullWithId;
  };

  return { getTrade, getTrades, createTrade, };
};

export default useTrades;