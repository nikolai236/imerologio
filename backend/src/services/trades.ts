import { type TradeWithOrders, type Order } from "../../../shared/trades.types";


const useTradeService = () => {
	const _mult = (o: Order) => o.type == 'BUY' ? 1 : -1;

	const calculatePnL = (trade: TradeWithOrders) => {
		const sum = trade.orders.reduce((prev, o) => {
			return prev - _mult(o) * o.quantity * o.price;
		}, 0);
		trade.pnl = sum;
		return trade;
	};

	const checkQuantities = (orders: Order[]) => {
		return orders.reduce((prev, o) => {
			return prev + _mult(o) * o.quantity;
		}, 0) == 0;
	};

	return { calculatePnL, checkQuantities };
};

export default useTradeService;