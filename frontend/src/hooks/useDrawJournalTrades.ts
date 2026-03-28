import { useEffect, useRef, type Dispatch, type RefObject } from "react";

import type { ResizeHandle } from "../chart-plugins/trade-position";
import type { Direction, TempJournalTrade } from "./useJournalTrades";
import type { Timeframe } from "../../../shared/candles.types";
import type { IChartApi, MouseEventParams, Time, UTCTimestamp } from "lightweight-charts";
import type { TempJournalChart } from "./useJournalCharts";

import TradePosition from "../chart-plugins/trade-position";
import useTimeframe from "./useTimeframe";
import useJournalContext from "./useJournalContext";

const SECOND = 1000;

type DragState = {
	trade: TradePosition;
	handle: ResizeHandle;
};

type NormalizeEntries = ReturnType<
	typeof useTimeframe
>["normalizeEntry"];

const displayTrade = (
	trade: TempJournalTrade,
	tf: Timeframe,
	normalizeEntry: NormalizeEntries,
) => {
	const { orders, stop, target, tempId } = trade;

	const [entry, ...rest] = [...orders]
		.sort((a, b) => Number(a.date) - Number(b.date))
		.map(order => ({
			tempId: order.tempId,
			type: order.type,
			price: Number(order.price),
			time: Math.floor(new Date(order.date).getTime() / 1000) as UTCTimestamp,
			quantity: Number(order.quantity),
		}))
		.map(order => normalizeEntry(order, tf));

	const exits = rest
		.filter(e => e.type !== entry.type)
		.map(({ quantity, ...o }) => ({ ...o, quantity: -quantity }));

	return new TradePosition([entry], exits, stop, entry.type, target, tempId);
};

const getTimeExtremes = (chartRef: RefObject<IChartApi | null>) => {
	if (!chartRef.current) return null;

	const visibleRange = chartRef.current
		.timeScale()
		.getVisibleRange();

	if (!visibleRange) return null;

	const minTime = visibleRange.from;
	const maxTime = visibleRange.to;

	return { minTime, maxTime };
}

const useDrawJournalTrades = (
	seriesRef: RefObject<ReturnType<IChartApi["addSeries"]> | null>,
	chartRef: RefObject<IChartApi | null>,
	containerRef: RefObject<HTMLDivElement | null>,
	chart: TempJournalChart,
	trades: TempJournalTrade[],
	drawingTrade: Direction | null,
	setDrawingTrade: Dispatch<Direction | null>,
	tf: Timeframe,
) => {
	const { normalizeEntry } = useTimeframe();
	const { addTrade, updateOrder, updateTrade } = useJournalContext();

	const dragStateRef = useRef<DragState | null>(null);
	const hoveredHandleRef = useRef<ResizeHandle | null>(null);

	const tradePrimitivesRef = useRef<TradePosition[]>([]);
	const drawingTradeRef = useRef<Direction | null>(drawingTrade);

	useEffect(() => {
		drawingTradeRef.current = drawingTrade;
	}, [drawingTrade]);

	useEffect(() => {
		if (!seriesRef.current || !chartRef.current) return;

		for (const primitive of tradePrimitivesRef.current) {
			seriesRef.current.detachPrimitive?.(primitive);
		}
		tradePrimitivesRef.current = [];

		for (const trade of trades) {
			const pos = displayTrade(trade, tf, normalizeEntry);
			seriesRef.current.attachPrimitive(pos);
			tradePrimitivesRef.current.push(pos);
		}
	}, [trades, tf]);


	const setCursor = (cursor: string) => {
		if (!containerRef.current) return;
		containerRef.current.style.cursor = cursor;
	};

	const getHandleCursor = (handle: ResizeHandle) => {
		if (handle === "top" || handle === "bottom" || handle === "mid") {
			return "ns-resize";
		}
		return "ew-resize";
	};

	const findHoveredHandle = (x: number, y: number) => {
		for (let i = tradePrimitivesRef.current.length - 1; i >= 0; i--) {
			const trade = tradePrimitivesRef.current[i];
			const handle = trade.hitTestResizeHandle(x, y);
			if (handle) {
				return { trade, handle };
			}
		}
		return null;
	};

	const onClickTradeHandler = (params: MouseEventParams<Time>) => {
		const direction = drawingTradeRef.current;

		if (
			!direction ||
			!seriesRef.current ||
			!chartRef.current ||
			!containerRef.current ||
			!params.point ||
			!params.time
		) {
			return;
		}

		const entryPrice = seriesRef.current
			.coordinateToPrice(params.point.y);

		if (entryPrice == null) return;

		const chartHeight = containerRef.current.clientHeight;
		const bufferPx = chartHeight / 4;

		const targetY =
			direction === "Long"
				? params.point.y - bufferPx
				: params.point.y + bufferPx;

		const targetPrice = seriesRef.current.coordinateToPrice(targetY);
		if (targetPrice == null) return;

		const bufferPrice = Math.abs(targetPrice - entryPrice);
		if (!Number.isFinite(bufferPrice) || bufferPrice <= 0) return;

		const startS = Number(params.time);

		const res = getTimeExtremes(chartRef);
		if (!res) return;

		const { maxTime, minTime } = res;
		const [max, min] = [Number(maxTime), Number(minTime)]

		const span = max - min;

		const endS = Math.max(
			startS,
			Math.min(Math.floor(startS + span / 4), max)
		);

		if (endS === startS) return;

		addTrade(
			chart,
			startS,
			endS,
			entryPrice,
			bufferPrice,
			direction,
		);

		setDrawingTrade(null);
	};

	const onPointerMove = (e: PointerEvent) => {
		if (!containerRef.current || !seriesRef.current || !chartRef.current) return;

		const rect = containerRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const dragState = dragStateRef.current;
		if (!dragState) {
			const hovered = findHoveredHandle(x, y);
			hoveredHandleRef.current = hovered?.handle!;

			if (hovered) {
				setCursor(getHandleCursor(hovered.handle));
			} else {
				setCursor("default");
			}

			return;
		}

		const { trade, handle } = dragState;

		const tradeId = trade.getTempId();

		if (handle === "top" || handle === "bottom" || handle === "mid") {
			const price = seriesRef.current.coordinateToPrice(y);
			if (price == null) return;

			if (handle === "bottom") {
				const exits = trade.setStop(price);
				if (exits == null) return;

				updateTrade(tradeId, { stop: price });
				for (const { tempId, price } of exits) {
					updateOrder(tradeId, tempId!, { price });
				}

				return;
			}

			if (handle === "top") {
				const exits = trade.setTarget(price);
				if (exits == null) return;

				updateTrade(tradeId, { target: price });

				for (const { tempId, price } of exits) {
					updateOrder(tradeId, tempId!, { price });
				}

				return;
			}

			const entry = trade.setEntryPrice(price);
			if (entry == null) return;

			const { tempId: id, price: entryPrice } = entry;
			updateOrder(tradeId, id!, { price: entryPrice });

			return;
		}

		const { minTime, maxTime } = getTimeExtremes(chartRef)!;

		const time = chartRef.current
			.timeScale()
			.coordinateToTime(x);

		if (time == null || time < minTime || time > maxTime) return;

		const ts = Number(time) as UTCTimestamp;

		if (handle === "left") {
			const entry = trade.setEntryTime(ts);
			if (entry == null) return;

			const { time, tempId: id } = entry;
			const date = new Date(time * SECOND);

			updateOrder(tradeId, id!, { date });
			return;
		}

		if (handle === "right") {
			const exits = trade.setExitTime(ts);
			if (exits == null) return;

			for (const { tempId, time } of exits) {
				const date = new Date(time * SECOND);
				updateOrder(tradeId, tempId!, { date });
			}
			return;
		}

	};

	const onPointerDown = (e: PointerEvent) => {
		if (!containerRef.current) return;

		const rect = containerRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const hovered = findHoveredHandle(x, y);
		if (!hovered) return;

		dragStateRef.current = hovered;
		setCursor(getHandleCursor(hovered.handle));

		e.preventDefault();
	};

	const onPointerUp = () => {
		dragStateRef.current = null;

		const hovered = hoveredHandleRef.current;
		if (hovered) {
			setCursor(getHandleCursor(hovered));
		} else {
			setCursor("default");
		}
	};

	const setupTradesResizeEventListeners = () => {
		containerRef.current?.addEventListener("pointermove", onPointerMove);
		containerRef.current?.addEventListener("pointerdown", onPointerDown);

		window.addEventListener("pointerup", onPointerUp);
	};

	const clearTradesResizeEventListeners = () => {
		containerRef.current?.removeEventListener("pointermove", onPointerMove);
		containerRef.current?.removeEventListener("pointerdown", onPointerDown);
		window.removeEventListener("pointerup", onPointerUp);
	};

	return {
		drawingTradeRef,
		dragStateRef,
		onClickTradeHandler,
		setupTradesResizeEventListeners,
		clearTradesResizeEventListeners,
	} as const;
};

export default useDrawJournalTrades;