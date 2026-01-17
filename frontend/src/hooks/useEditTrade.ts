import { useEffect, useState } from "react";
import type { Chart, Order, Trade, ApiTrade } from "../../../shared/trades.types";
import useTradeOrders from "./useTradeOrders";
import type { Timeframe } from "../../../shared/candles.types";
import useTradeCharts from "./useTradeCharts";
import useTrades from "./useTrades";
import useReload from "./useReload";
import useSymbolId from "./useSymbolId";
import useEntryCalendar from "./useEntryCalendar";

const useEditTrade = (tradeId?: number) => {
	const {
		orders,
		orderSum,
		getEntry,
		getExits,
		setOrders,
		updateOrder,
		addOrder,
		removeOrder,
	} = useTradeOrders(new Date());

	const {
		charts,
		setCharts,
		addChart,
		removeChart,
		updateChart,
	} = useTradeCharts();

	const {
		calendar,
		loading: calendarLoading,
		error: calendarError,
	} = useEntryCalendar(orders);

	const { symbolId, isSupported, setSymbolId } = useSymbolId();
	const { createTrade, editTrade, getTrade } = useTrades();

	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [reloadToken, reload] = useReload();

	const [stop, setStop] = useState<number|null>(null);
	const [target, setTarget] = useState<number|null>(null);

	const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
	const [description, setDescription] = useState('');

	const setNull = () => {
		setSymbolId('');
		setStop(null);
		setTarget(null);
		setDescription('');

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
		setFormError(null);

		const sId = Number(symbolId);
		if (!Number.isInteger(sId) || sId <= 0) throw new Error("Please select a valid symbol.");

		if (orders.length === 0) throw new Error("Please add at least one order.");

		if (orderSum !== 0) {
			throw new Error(`Orders must net to 0. Current net quantity is ${orderSum} (BUY is +, SELL is -).`);
		}

		const validatedOrders = orders.map(({ price, quantity, date, type }) => ({
			price: Number(price),
			quantity: Number(quantity),
			date,
			type,
		}));

		const validatedCharts: Chart<Timeframe>[] = charts.map(c => ({
			...c,
			tempId: undefined,
		}));

		const ret: Trade<Chart<Timeframe>> = {
			stop: stop as number,
			target: target as number,
			description,
			pnl: undefined,
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

		if (validatedOrders.some(({ quantity }) => !Number.isInteger(quantity) || quantity < 1)) {
			throw new Error("Quantities should be whole numbers >= 1")
		}

		const orderThrowCond = (o: Order) => [o.price, o.quantity, o.date].some(r => isNaN(r))
		if (validatedOrders.some(orderThrowCond)) {
			throw new Error("Trade value is not a number");
		}

		return ret;
	};

	const submitNewTrade = async () => {
		let trade: Trade<Chart<Timeframe>>;
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

		} catch (e: any) {
			console.error(e);
			setFormError(e?.message ?? "Failed to create trade");
		} finally {
			reload();
			setSubmitting(false);
		}
	};

	const submitTradeEdit = async () => {
		if (!tradeId) throw new Error('Trade id is null!.');

		let trade: Trade<Chart<Timeframe>>;
		try {
			trade = validate();
		} catch (err: any) {
			return setFormError(err.message);
		}

		setSubmitting(true);
		setFormError(null);

		try {
			await editTrade(tradeId, trade);

		} catch (e: any) {
			console.error(e);
			setFormError(e?.message ?? "Failed to edit trade");
		} finally {
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

	return {
		calendar,
		calendarError,
		calendarLoading,

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

		getEntry,
		getExits,

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
	};
};

export default useEditTrade;