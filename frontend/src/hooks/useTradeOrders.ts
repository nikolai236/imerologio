import { useState, useMemo, useCallback } from "react";
import type { DbOrder, Order } from "../../../shared/trades.types";
import type { Entry, Exit, Timeframe } from "../../../shared/candles.types";
import useTimeframe from "./useTimeframe";
import type { UTCTimestamp } from "lightweight-charts";

export type TempOrder = Order<number> & {
	tempId: string;
};

const uid = () =>
	Math.random().toString(16).slice(2) +
	Date.now().toString(16);

const useTradeOrders = (date: Date, stop: number | null) => {
	const { normalizeEntries, normalizeEntry } = useTimeframe();

	const [orders, setOrders] = useState<TempOrder[]>([]);

	const getDefaultOrder = (orders: TempOrder[]): TempOrder => orders.length == 0 ?
		{
			date: date.getTime(),
			price: stop ?? 0,
			type: "BUY",
			quantity: 1,
			tempId: uid(),
		} : {
			...orders.at(-1)!,
			tempId: uid(),
		};

	const orderSum = useMemo(() => orders.reduce((sum, { type, quantity }) =>
		sum + (type == "BUY" ? 1 : -1) * Number(quantity), 0
	), [orders]);

	const addOrder = () => setOrders(orders => [
		...orders, getDefaultOrder(orders)
	]);

	const updateOrder = (id: string, payload: Partial<TempOrder>) => setOrders(orders =>
		orders
			.map(order => order.tempId == id ?
				{ ...order, ...payload, tempId: id } : order
			).sort((a, b) => a.date - b.date),
	);

	const removeOrder = (id: string) => setOrders(orders =>
		orders.filter(o => o.tempId != id)
	);

	const overwriteOrders = (orders: DbOrder<Date>[]) => setOrders(orders
		.map(o => ({
			...o,
			date: new Date(o.date).getTime(),
			tempId: uid(),
		}))
		.sort((a, b) => a.date - b.date)
	);

	const entryOrder = useMemo(() => {
		if (orders.length == 0) return null;
		const [order] = orders;
		return {
			price: Number(order.price),
			time: Math.floor(order.date / 1000) as UTCTimestamp,
			quantity: Number(order.quantity),
		};
	}, [orders]);

	const exitOrders = useMemo(() => {
		if (orders.length == 0 || orderSum != 0) {
			return [];
		}
		const direction = orders[0].type;

		return orders
			.filter(order => order.type != direction)
			.map(order => ({
				...order,
				time: Math.floor(order.date / 1000) as UTCTimestamp,
				quantity: -order.quantity,
				price: Number(order.price)
			}));
	}, [orderSum, orders]);

	const getExitsForTf = useMemo(() => (tf: Timeframe) =>
		normalizeEntries(exitOrders, tf) as Exit[]
	, [exitOrders]);

	const getEntryForTf = useCallback(
		(tf: Timeframe) =>
			entryOrder != null
				? normalizeEntry(entryOrder, tf) as Entry
				: null,
		[orders]
	);

	return {
		orders,
		orderSum,

		entryOrder,
		exitOrders,

		setOrders: overwriteOrders,
		updateOrder,

		addOrder,
		removeOrder,

		getExitsForTf,
		getEntryForTf,
	};
};

export default useTradeOrders;