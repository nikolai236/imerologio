import { useCallback, useState } from "react";
import type { Timeframe } from "../../../shared/candles.types";
import type {
	DbJournalOrder,
	DbJournalTrade,
	JournalOrder,
	JournalTrade
} from "../../../shared/journal.types";
import type { OrderEnum } from "../../../shared/trades.types";
import type { TempJournalChart } from "./useJournalCharts";

export type TempJournalOrder = (
	DbJournalOrder<Date> |
	JournalOrder<Date>
) & {
	tempId: string;
	id?: number;
};

export type TempJournalTrade = Omit<(
	DbJournalTrade<Date, Timeframe> |
	JournalTrade<Date>
), "orders"> & {
	tempId: string;
	orders: TempJournalOrder[];
	id?: number;
};

type EpochOrder = (
	Omit<TempJournalOrder, "date"> & {
		date: number;
	}
) | TempJournalOrder;

type UpdateOrdersPayload = {
	orders:
		TempJournalOrder[] |
		((orders: TempJournalOrder[]) => TempJournalOrder[]);
};

export type Direction = "Long" | "Short";

export type AddTrade = (
	chart: TempJournalChart,
	startS: number,
	endS: number,
	entryPrice: number,
	bufferPrice: number,
	direction: Direction
) => void;

const SECOND = 1000;

const uid = () =>
	Math.random().toString(16).slice(2) +
	Date.now().toString(16);

const generateNewOrder = (
	epochS: number,
	price: number,
	type: OrderEnum,
): TempJournalOrder => ({
	quantity: 1,
	date: new Date(epochS * SECOND),
	tempId: uid(),
	type,
	price,
});

const generateNewTrade = (
	startS: number,
	endS: number,
	entryPrice: number,
	symbolId: number,
	bufferPrice: number,
	direction: Direction,
): TempJournalTrade => {
	const target =
		direction === "Long"
			? entryPrice + bufferPrice
			: entryPrice - bufferPrice;

	const stop =
		direction === "Long"
			? entryPrice - bufferPrice
			: entryPrice + bufferPrice;

	const entryType = direction === "Long" ? "BUY" : "SELL";
	const exitType = direction === "Long" ? "SELL" : "BUY";

	const entry = generateNewOrder(startS, entryPrice, entryType);
	const exit = generateNewOrder(endS, target, exitType);

	const orders = [entry, exit];
	const pnl = orders.reduce((prev, o) =>
		prev - (o.type === "BUY" ? 1 : -1) * o.quantity * o.price, 0
	);

	return {
		tempId: uid(),
		pnl,
		target,
		stop,
		symbolId,
		orders,
	};
};

const recalculateTradePnl = (trade: TempJournalTrade) => {
	return trade.orders.reduce((prev, order) =>
		prev - (order.type == "BUY" ? 1 : -1) * order.quantity * order.price, 0
	);
};

const useJournalTrades = () => {
	const [trades, setTrades] = useState<TempJournalTrade[]>([]);

	const addTrade: AddTrade = (
		chart: TempJournalChart,
		startS: number,
		endS: number,
		entryPrice: number,
		bufferPrice: number,
		direction: Direction,
	) => setTrades(prev => {
		if (chart.symbolId == null) return prev;

		const trade = generateNewTrade(
			startS,
			endS,
			entryPrice,
			chart.symbolId,
			bufferPrice,
			direction
		);

		return [...prev, trade];
	});

	const updateTrade = (
		id: string,
		payload: Partial<TempJournalTrade> | UpdateOrdersPayload
	) => setTrades(prev => prev.map(t => {
		if (t.tempId !== id) return t;

		const { orders, ...rest } = payload;
		if (orders == null) {
			return { ...t, ...rest };
		}

		const next =
			typeof orders === "function"
				? orders(t.orders)
				: orders;

		const sorted = next
			.slice()
			.sort((a, b) =>
				new Date(a.date).getTime() -
				new Date(b.date).getTime()
			);

		const nextTrade = {
			...t,
			...rest,
			orders: sorted,
		};

		return {
			...nextTrade,
			pnl: recalculateTradePnl(nextTrade),
		};
	}));

	const removeTrade = (id: string) => setTrades(
		prev => prev.filter(t => t.tempId != id)
	);


	const addOrder = (tradeId: string) => updateTrade(tradeId, {
		orders: (orders) => {
			if (orders.length === 0) return orders;
			const { id, ...rest } = orders.at(-1)!;
			return [
				...orders,
				{ ...rest, tempId: uid() }
			];
		}
	});

	const updateOrder = (
		tradeId: string,
		orderId: string,
		{ date, ...payload } : Partial<TempJournalOrder | EpochOrder>
	) => updateTrade(tradeId, {
		orders: (orders) => orders
			.map(order => {
				if (order.tempId !== orderId) {
					return order;
				}
				return {
					...order,
					...payload,
					...(date != null && {
						date: new Date(date)
					}),
				};
			})
	});

	const removeOrder = (
		tradeId: string,
		orderId: string,
	) => updateTrade(tradeId, {
		orders: (orders) => orders.filter(
			order => order.tempId !== orderId
		),
	});

	const getOrders = useCallback(
		(tradeId: string) =>
			trades.find(t => t.tempId == tradeId)?.orders ?? null,
		[trades]
	);

	type ApiTrade = 
		DbJournalTrade<Date, Timeframe> |
		DbJournalTrade<string, Timeframe>;

	const overwriteTrades = (trades: ApiTrade[]) => setTrades(
		trades.map(trade => {
			const {
				id,
				pnl,
				target,
				stop,
				symbolId,
			} = trade;

			const orders = trade.orders
				.map(({ date, ...order }) => ({
					...order,
					date: new Date(date),
					tempId: uid(),
				}))
				.sort((a , b) =>
					a.date.getTime() - b.date.getTime()
				);

			return {
				id,
				tempId: uid(),
				pnl,
				target,
				stop,
				symbolId,
				orders,
			};
		})
	);

	return {
		trades,
		addTrade,
		updateTrade,
		removeTrade,

		getOrders,
		addOrder,
		updateOrder,
		removeOrder,

		setTrades: overwriteTrades,
	} as const;
};

export default useJournalTrades;