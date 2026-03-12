import type { IChartApi, MouseEventParams, Time } from "lightweight-charts";
import { useState, type RefObject } from "react";

export type CopyMenuContext = {
	x: number;
	y: number;
	price: number;
};

type SeriesRef = RefObject<ReturnType<IChartApi["addSeries"]> | null>;

const useCopyMenu = (seriesRef: SeriesRef) => {
	const [ctx, setCtx] = useState<CopyMenuContext | null>(null);

	const copyClickHandler = (params: MouseEventParams<Time>) => setCtx((prev) => {
		if (params.point == null || prev != null || seriesRef.current == null) {
			return null;
		}

		const x = params.point.x;
		const y = params.point.y;

		const price = seriesRef.current.coordinateToPrice(y);
		if (!price) return null;

		return { x: x + 8, y: y + 8, price };
	});

	return {
		copyMenuContext: ctx,
		closeCopyMenu: () => setCtx(null),
		copyClickHandler,
	} as const;
};

export default useCopyMenu;