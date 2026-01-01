import { useState, useMemo } from "react";
import type { Order } from "../../../shared/trades.types";

export type TempOrder = Order & {
	tempId: string;
}

const useTradeOrders = (date: Date) => {
	const [orders, setOrders] = useState<TempOrder[]>([]);

	const _uid = () =>
		Math.random().toString(16).slice(2) +
		Date.now().toString(16);

	const _getDefaultOrder = (orders: TempOrder[]): TempOrder => orders.length == 0 ?
		{ date, price: 0, type: 'BUY', quantity: 1, tempId: _uid(), } :
		{ ...orders.at(-1)!, tempId: _uid() };

	const _calculateOrderSum = () => orders.reduce((prev, { type, quantity }) =>
		prev + (type == 'BUY' ? 1 : -1) * quantity, 0
	);

	const updateOrder = (id: string, payload: Partial<Order>) => setOrders(
		orders => orders.map(o => o.tempId != id ? o : { ...o, ...payload })
	);

	const addOrder = () => setOrders(
		orders => [...orders, _getDefaultOrder(orders)]
	);

	const removeOrder = (id: string) => setOrders(
		orders => orders.filter(o => o.tempId != id)
	);

	const orderSum = useMemo(_calculateOrderSum, [orders]);

	return {
		orders,
		orderSum,

		setOrders,
		updateOrder,

		addOrder,
		removeOrder,
	};
};

export default useTradeOrders;