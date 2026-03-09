import type { IChartApi, MouseEventParams, Time } from "lightweight-charts";
import { useEffect, useRef, type RefObject } from "react";
import Line from "../chart-plugins/line";
import type { Point } from "../chart-plugins/plugin-base";
import type { ChartLine } from "../../../shared/trades.types";

const toPoint = (p: any): Point => ({ time: p.time, price: p.price });

const useDrawLines = (
	seriesRef: RefObject<ReturnType<IChartApi["addSeries"]> | null>,
	lines: ChartLine[],
	closeCopyMenu: () => void,
	commit: (lines: ChartLine[]) => void,
) => {
	const linesRef = useRef<ChartLine[]>(lines);
	const linePrimitivesRef = useRef<Line[]>([]);
	const drawingRef = useRef(false);

	// copy lines' state to hook safely
	useEffect(() => {
		linesRef.current = lines;
	}, [lines]);

	const attachAll = () => {
		if (!seriesRef.current) return;

		for (const [p1, p2] of linesRef.current) {
			const line = new Line(toPoint(p1), toPoint(p2));

			seriesRef.current.attachPrimitive(line);
			linePrimitivesRef.current.push(line);
		}
	};

	const lineClickHandler = (params: MouseEventParams<Time>) => {
		if (!params.time || !params.point || !seriesRef.current) return;

		if (drawingRef.current) {
			drawingRef.current = false;
			commit(linesRef.current);
			return;
		}

		const { time, point: { y } } = params;

		const price = seriesRef.current.coordinateToPrice(y);
		if (price == null) return;

		closeCopyMenu();

		const p1: Point = { time, price };
		const p2: Point = { time, price };

		const line = new Line(p1, p2);
		seriesRef.current.attachPrimitive(line);
		linePrimitivesRef.current.push(line);

		linesRef.current.push(line.toChartLine());
		drawingRef.current = true;
	};

	const lineMouseMoveHandler = (params: MouseEventParams<Time>) => {
		if (!params.time || !params.point || !seriesRef.current) return;
		if (!drawingRef.current) return;

		const price = seriesRef.current.coordinateToPrice(params.point.y);
		if (price == null) return;

		const p2: Point = { time: params.time, price };

		const lastIdx = linePrimitivesRef.current.length - 1;
		if (lastIdx < 0) return;

		const last = linePrimitivesRef.current[lastIdx];
		last.setSecondPoint(p2);

		const lastDataIdx = linesRef.current.length - 1;
		if (lastDataIdx < 0) return;

		const [p1] = linesRef.current[lastDataIdx];
		linesRef.current = [
			...linesRef.current.slice(0, lastDataIdx),
			[p1, { time: p2.time as number, price: p2.price }],
		];
	};

	return {
		attachAll,
		linesRef: linePrimitivesRef,
		lineClickHandler,
		lineMouseMoveHandler,
	} as const;
};

export default useDrawLines;