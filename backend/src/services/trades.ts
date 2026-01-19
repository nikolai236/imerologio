import type { Order, } from "../../../shared/trades.types";

const _mult = (o: Order<any>) => o.type == 'BUY' ? 1 : -1;

export const parseOrders = (orders: (Order<number> & { id?: number; })[]) => orders.map(o => ({
	...o,
	id: ('id' in o) ? Number(o.id) : undefined,
	quantity: Number(o.quantity),
	date:     new Date(o.date),
	price:    Number(o.price),
}));

export const calculatePnL = (orders: Order<Date>[]) => {
	return orders.reduce((prev, o) => {
		return prev - _mult(o) * o.quantity * o.price;
	}, 0);
};

export const validateOrderQuantities = (orders: Order[]) => {
	return orders.reduce((prev, o) => {
		return prev + _mult(o) * o.quantity;
	}, 0) == 0;
};