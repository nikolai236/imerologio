import type { IChartApi, MouseEventParams, Time } from "lightweight-charts";
import { useEffect, useRef, type Dispatch, type RefObject } from "react";

import type { Point } from "../chart-plugins/plugin-base";
import type { ChartLine } from "../../../shared/trades.types";

import Line from "../chart-plugins/line";

const toPoint = (p: any): Point => ({
	time: p.time,
	price: p.price,
});

const useDrawLinesTool = (
	seriesRef: RefObject<ReturnType<IChartApi["addSeries"]> | null>,
	serializedLines: ChartLine[],

	setDrawingMode: Dispatch<React.SetStateAction<boolean>>,
	closeCopyMenu: () => void,
	commitLines: (lines: ChartLine[]) => void,
) => {
	const serializedLinesRef = useRef<ChartLine[]>(serializedLines);
	const linePrimitivesRef = useRef<Line[]>([]);
	const drawingRef = useRef(false);

	// copy lines' state to hook safely
	useEffect(() => {
		serializedLinesRef.current = [
			...serializedLines,
		];
	}, [serializedLines]);

	const attachPrimitives = () => {
		if (!seriesRef.current) return;

		linePrimitivesRef.current = [];

		for (const [p1, p2] of serializedLinesRef.current) {
			const line = new Line(toPoint(p1), toPoint(p2));

			seriesRef.current.attachPrimitive(line);
			linePrimitivesRef.current.push(line);
		}
	};

	const deleteLine = (line: Line) => {
		if (!seriesRef.current) return;

		const idx = linePrimitivesRef.current
			.findIndex(l => l === line);

		if (idx < 0) return;

		seriesRef.current.detachPrimitive(line);

		console.assert(
			idx < serializedLinesRef.current.length,
			"Out of bounds line delete idx"
		);

		serializedLinesRef.current = [
			...serializedLinesRef.current.slice(0, idx),
			...serializedLinesRef.current.slice(idx + 1),
		];

		linePrimitivesRef.current = linePrimitivesRef.current.filter(l => l !== line);

		commitLines(serializedLinesRef.current);
	}

	const lineClickHandler = (params: MouseEventParams<Time>) => {
		if (!params.time || !params.point || !seriesRef.current) return;

		if (drawingRef.current) {
			setDrawingMode(false);
			drawingRef.current = false;

			commitLines(serializedLinesRef.current);
			return;
		}

		const time = params.time;
		const y = params.point.y;

		const price = seriesRef.current.coordinateToPrice(y);
		if (price == null) return;

		closeCopyMenu();

		const p1: Point = { time, price };
		const p2: Point = { time, price };

		const line = new Line(p1, p2);

		seriesRef.current.attachPrimitive(line);
		linePrimitivesRef.current.push(line);

		serializedLinesRef.current = [
			...serializedLinesRef.current,
			line.serialize()
		];

		drawingRef.current = true;
	};

	const lineMouseMoveHandler = (params: MouseEventParams<Time>) => {
		if (!params.time || !params.point || !seriesRef.current) return;
		if (!drawingRef.current) return;

		const price = seriesRef.current.coordinateToPrice(params.point.y);
		if (price == null) return;

		const p2: Point = { time: params.time, price };

		const lastPrimIdx = linePrimitivesRef.current.length - 1;
		if (lastPrimIdx < 0) return;

		const last = linePrimitivesRef.current[lastPrimIdx];
		last.setSecondPoint(p2);

		const lastDataIdx = serializedLinesRef.current.length - 1;
		if (lastDataIdx < 0) return;

		const serialized: ChartLine = [
			serializedLinesRef.current[lastDataIdx][0],
			{ time: p2.time as number, price: p2.price }
		];

		serializedLinesRef.current = [
			...serializedLinesRef.current.slice(0, lastDataIdx),
			serialized,
		];
	};

	return {
		linesRef: linePrimitivesRef,
		deleteLine,
		attachPrimitives,
		lineClickHandler,
		lineMouseMoveHandler,
	} as const;
};

export default useDrawLinesTool;