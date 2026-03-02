import type { IChartApi, MouseEventParams, Time } from "lightweight-charts";
import { useCallback, useRef, type RefObject } from "react";
import Line from "../chart-plugins/line";
import type { Point } from "../chart-plugins/plugin-base";

const useDrawLines = (
	seriesRef: RefObject<ReturnType<IChartApi["addSeries"]> | null>,
	closeCopyMenu: () => void,
) => {
	const linesRef = useRef<Line[]>([]);
	const drawingRef = useRef(false);

	const lineClickHandler = (params: MouseEventParams<Time>) => {
		if (!params.time || !params.point || !seriesRef.current) return;

		if (drawingRef.current) {
			drawingRef.current = false;
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
		linesRef.current.push(line);

		drawingRef.current = true;
	};

	const lineMouseMoveHandler = useCallback((params: MouseEventParams<Time>) => {
		if (!params.time || !params.point || !seriesRef.current) return;
		if (!drawingRef.current) return;

		const price = seriesRef.current.coordinateToPrice(params.point.y);
		if (price == null) return;

		const p2: Point = { time: params.time, price };

		const linesLen = linesRef.current.length;
		if (linesLen > 0) {
			const last = linesRef.current[linesLen - 1];
			return last.setSecondPoint(p2);
		}
	}, []);

	return {
		linesRef,
		lineClickHandler,
		lineMouseMoveHandler,
	} as const;
};

export default useDrawLines;