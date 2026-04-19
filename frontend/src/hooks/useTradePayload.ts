import { useEffect, useState } from "react";

import type { Chart, Order, Trade, ApiTrade } from "../../../shared/trades.types";
import type { Timeframe } from "../../../shared/candles.types";

import useTradeOrders from "./useTradeOrders";
import useTradeCharts from "./useTradeCharts";
import useReload from "./useReload";
import useSymbolId from "./useSymbolId";

import { createTrade, editTrade, getTrade } from "../api/trades";

const useTradePayload = (tradeId?: number) => {
	const { symbolId, isSupported, setSymbolId } = useSymbolId();

	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [reloadToken, reload] = useReload();

	const [stop, setStop] = useState<number|null>(null);
	const [target, setTarget] = useState<number|null>(null);

	const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
	const [description, setDescription] = useState("");

	const {
		orders,
		orderSum,
		getEntryForTf,
		getExitsForTf,
		setOrders,
		updateOrder,
		addOrder,
		removeOrder,
	} = useTradeOrders(new Date(), stop);

	const {
		charts,
		setCharts,
		addChart,
		removeChart,
		updateChart,
	} = useTradeCharts(orders);

	const setNull = () => {
		setSymbolId("");
		setStop(null);
		setTarget(null);
		setDescription("");

		setSelectedLabelIds([]);

		setOrders([]);
		setCharts([]);
	};

	const retrieveTradeValues = (t: ApiTrade) => {
		const ids = t.labels.map(({ id }) => id);

		setSymbolId(t.symbolId.toString());
		setStop(t.stop);
		setTarget(t.target ?? null);
		setDescription(t.description ?? '');

		setSelectedLabelIds(ids);

		setOrders(t.orders);
		setCharts(t.charts);
	};

	const validate = () => {
		const sId = Number(symbolId);
		if (!Number.isInteger(sId) || sId <= 0) {
			throw new Error("Please select a valid symbol.");
		}

		if (orders.length === 0) {
			throw new Error("Please add at least one order.");
		}

		if (orderSum !== 0) {
			throw new Error(
				`Orders must net to 0. Current net quantity is ${orderSum} (BUY is +, SELL is -).`
			);
		}

		const validatedOrders = orders.map(({ price, quantity, date, type }) => ({
			price: Number(price),
			quantity: Number(quantity),
			date,
			type,
		}));

		if (stop == null) throw new Error("Please set a stop loss.");

		const { type, price } = orders[0];

		const long  = price >= stop && type == "BUY";
		const short = price <= stop && type == "SELL";

		if (!long && !short) {
			throw new Error("Invalid stop loss");
		}

		const validatedCharts = charts
			.map(({ tempId, createdAt, ...rest }) => ({
				...rest, createdAt: new Date(createdAt).toISOString()
			})) as unknown as Chart<Timeframe>[];

		const ret: Trade<Timeframe, number> = {
			stop,
			target: target ?? undefined,
			description,
			labels: selectedLabelIds.map(id => ({ id })),
			charts: validatedCharts,
			orders: validatedOrders,
			symbolId: Number(symbolId),
		};

		const tradeBodythrowConds = [ret.target, ret.stop, ret.symbolId]
			.some(r => r != undefined && isNaN(r));

		if (tradeBodythrowConds) {
			throw new Error("Trade value is not a number");
		}

		if (
			validatedOrders.some(
				({ quantity }) =>
					!Number.isInteger(quantity) || quantity < 1
			)
		) {
			throw new Error("Quantities should be whole numbers >= 1")
		}

		const orderThrowCond = (o: Order<any>) =>
			[o.price, o.quantity, o.date].some(r => isNaN(r));

		if (validatedOrders.some(orderThrowCond)) {
			throw new Error("Trade value is not a number");
		}

		return ret;
	};

	const submitNewTrade = async () => {
		let trade: Trade<Timeframe, number>;
		try {
			trade = validate();
		} catch (err: any) {
			console.error(err);
			return setFormError(err.message);
		}

		setSubmitting(true);
		setFormError(null);

		try {

			await createTrade(trade);

		} catch (err: any) {
			console.error(err);
			setFormError(err?.message ?? "Failed to create trade");
		} finally {
			reload();
			setSubmitting(false);
		}
	};

	const submitTradeEdit = async (silent=false) => {
		if (!tradeId) {
			if (silent) return;
			throw new Error('Trade id is null!.');
		}

		let trade: Trade<Timeframe, number>;
		try {
			trade = validate();
		} catch (err: any) {
			if (silent) return;
			else return setFormError(err.message);
		}

		if (!silent) {
			setSubmitting(true);
			setFormError(null);
		}

		try {
			await editTrade(tradeId, trade);

		} catch (e: any) {
			if (silent) return;

			console.error(e);
			setFormError(e?.message ?? "Failed to edit trade");
		} finally {
			if (silent) return;

			reload();
			setSubmitting(false);
		}
	};

	useEffect(() => {
		if (tradeId == null) {
			setNull();
			return;
		}

		getTrade(tradeId)
			.then(retrieveTradeValues)
			.catch((err) => {
				console.error(err);
				setNull();
			});
	}, [reloadToken]);

	useEffect(() => {
		setFormError(null);

		if (orders.length == 0 || stop == null) {
			return;
		}

		const { type, price } = orders[0];

		const long  = price >= stop && type == "BUY";
		const short = price <= stop && type == "SELL";

		if (!long && !short) {
			setFormError("Invalid stop loss");
		}
	}, [orders, stop]);

	return {
		tradeId,

		formError,
		submitting,

		symbolId,
		stop,
		target,
		description,
		charts,
		orders,
		orderSum,
		isSupported,
		selectedLabelIds,

		getEntryForTf,
		getExitsForTf,

		setStop,
		setTarget,
		setDescription,

		addChart,
		removeChart,
		updateChart,

		updateOrder,
		addOrder,
		removeOrder,

		setSelectedLabelIds,
		submitNewTrade,
		submitTradeEdit,
		setSymbolId
	} as const;
};

export default useTradePayload;