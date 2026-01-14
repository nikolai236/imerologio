import { useState, useMemo } from "react";
import type { DbOrder, Order } from "../../../shared/trades.types";
import type { Entry, Exit, Timeframe } from "../../../shared/candles.types";
import useTimeframe from "./useTimeframe";
import type { UTCTimestamp } from "lightweight-charts";

export type TempOrder = Order & {
	tempId: string;
};

const useTradeOrders = (date: Date) => {
	const { normalizeEntries, normalizeEntry } = useTimeframe();

	const [orders, setOrders] = useState<TempOrder[]>([]);

	const _uid = () =>
		Math.random().toString(16).slice(2) +
		Date.now().toString(16);

	const _getDefaultOrder = (orders: TempOrder[]): TempOrder => orders.length == 0 ?
		{ date: date.getTime(), price: 0, type: 'BUY', quantity: 1, tempId: _uid(), } :
		{ ...orders.at(-1)!, tempId: _uid() };

	const _calculateOrderSum = () => orders.reduce((prev, { type, quantity }) =>
		prev + (type == 'BUY' ? 1 : -1) * Number(quantity), 0
	);

	const updateOrder = (id: string, payload: Partial<TempOrder>) => setOrders(
		orders => orders
			.map(o => o.tempId != id ? o : { ...o, ...payload, tempId: id })
			.sort((a, b) => a.date - b.date),
	);

	const addOrder = () => setOrders(
		orders => [...orders, _getDefaultOrder(orders)]
	);

	const removeOrder = (id: string) => setOrders(
		orders => orders.filter(o => o.tempId != id)
	);

	const overwriteOrders = (orders: DbOrder<Date>[]) => setOrders(
		orders
			.map(o => ({
				...o,
				date: new Date(o.date).getTime(),
				tempId: _uid(),
			}))
			.sort((a, b) => a.date - b.date)
	);

	const getExits = (tf: Timeframe) => {
		if (orders.length == 0 || orderSum != 0) {
			return [];
		}

		const direction = orders[0].type;
		const ret = orders
			.filter(o => o.type != direction)
			.map(({ price, date, quantity }) => ({ price, time: date, quantity }))
			.map(o => ({ ...o, quantity: -o.quantity, price: Number(o.price) }))
			.map(o => ({ ...o, time: Math.floor(o.time / 1000) as UTCTimestamp }));

		return normalizeEntries(ret, tf) as Exit[];
	};

	const getEntry = (tf: Timeframe) => {
		const [order] = orders;
		const ret = {
			price: Number(order.price),
			time: Math.floor(order.date / 1000) as UTCTimestamp,
			quantity: Number(order.quantity)
		};
		return normalizeEntry(ret, tf) as Entry;
	};

	const orderSum = useMemo(_calculateOrderSum, [orders]);

	return {
		orders,
		orderSum,

		setOrders: overwriteOrders,
		updateOrder,

		addOrder,
		removeOrder,

		getExits,
		getEntry,
	};
};

export default useTradeOrders;