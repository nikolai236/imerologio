import { Timeframe } from "../../../shared/candles.types";
import type { JournalOrder } from "../../../shared/journal.types";
import type {
	DbChart,
	DbOrder,
	DbTrade,
	Order,
	Trade,
	UpdateOrder,
	UpdateTrade,
} from "../../../shared/trades.types";

import { numberToTf, tfToNumber } from "./candles";

type MaybeId = { id?: number };

const toNumber = <T>(value: T) =>
	value != null ? Number(value) : value;

const hasOrderId = (order: unknown): order is { id: number } =>
	typeof order === "object" &&
	order !== null &&
	"id" in order;

const getSignedQuantity = (
	order: Pick<Order<number> | JournalOrder<any>, "type" | "quantity">
) => (order.type === "BUY" ? 1 : -1) * order.quantity;

const isCompleteOrder = (
	order: Order<number> | UpdateOrder<number>
): order is Order<number> =>
	order.quantity != null &&
	order.price != null &&
	order.type != null &&
	order.date != null;

const getValidOrders = (
	orders: (Order<number> | UpdateOrder<number>)[] | undefined
): Order<number>[] | undefined => {
	if (orders == null) return undefined;
	return orders.every(isCompleteOrder) ? orders : undefined;
};

export function sanitizeOrders(
	orders: (Order<number> | DbOrder<number>)[]
): (Order<Date>)[] {
	return orders.map(order => ({
		...order,
		id: hasOrderId(order) ? Number(order.id) : undefined,
		quantity: Number(order.quantity),
		date: new Date(order.date),
		price: Number(order.price),
	}));
}

export function calculatePnL(orders: Order<number>[]) {
	return orders.reduce((sum, order) => {
		return sum - getSignedQuantity(order) * order.price;
	}, 0);
}

export function validateOrderQuantities(
	orders: (Order<number> | JournalOrder<any>)[]
) {
	const sum = orders.reduce((total, order) => {
		return total + getSignedQuantity(order);
	}, 0);

	return sum === 0;
}

export function serializeCharts(charts: DbChart<number>[]) {
	return charts.map(chart => ({
		...chart,
		timeframe: numberToTf(chart.timeframe),
	}));
}

export function serializeTrade({
	charts,
	...trade
}: DbTrade<number, number>) {
	return {
		...trade,
		charts: serializeCharts(charts),
	};
}

export function sanitizeCharts(charts: any[]): any[] {
	return charts.map(chart => ({
		id: "id" in chart ? chart.id : undefined,
		start: Number(chart.start),
		end: Number(chart.end),
		lines: chart.lines,
		createdAt: chart.createdAt,
		timeframe: tfToNumber(chart.timeframe),
	}));
}

export function sanitizeTrade(
	trade: Trade<Timeframe, number>
): Trade<number, Date>;

export function sanitizeTrade(
	trade: UpdateTrade<Timeframe, number>
): UpdateTrade<number, Date>;

export function sanitizeTrade(
	trade: Trade<Timeframe, number> | UpdateTrade<Timeframe, number>
): Trade<number, Date> | UpdateTrade<number, Date> {
	const {
		target,
		stop,
		pnl: _,
		symbolId,
		orders,
		charts,
		...rest
	} = trade;

	const validOrders = getValidOrders(orders);

	if (validOrders != null) {
		calculatePnL(validOrders);
	}

	return {
		...rest,
		target: toNumber(target),
		stop: toNumber(stop),
		symbolId: toNumber(symbolId),
		orders: validOrders != null ? sanitizeOrders(validOrders) as any : undefined,
		charts: charts != null ? sanitizeCharts(charts) as any : undefined,
	};
}