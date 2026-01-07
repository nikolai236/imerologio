import { type TradeWithOrders, type Order } from "../../../shared/trades.types";


const useTradeService = () => {
	const _mult = (o: Order) => o.type == 'BUY' ? 1 : -1;

	const parseOrders = <T extends Order>(orders: T[]) => orders.map(o => ({
		...o,
		id: ('id' in o) ? Number(o.id) : undefined,
		quantity: Number(o.quantity),
		date:     new Date(o.date),
		price:    Number(o.price),
	}));

	const calculatePnL = (trade: TradeWithOrders<any>) => {
		const sum = trade.orders.reduce((prev, o) => {
			return prev - _mult(o) * o.quantity * o.price;
		}, 0);
		trade.pnl = sum;
		return sum;
	};

	const validateOrderQuantities = (orders: Order[]) => {
		return orders.reduce((prev, o) => {
			return prev + _mult(o) * o.quantity;
		}, 0) == 0;
	};

	return { calculatePnL, validateOrderQuantities, parseOrders };
};

export default useTradeService;