import type { IChartApi, MouseEventParams, Time } from "lightweight-charts";
import { useState, type RefObject } from "react";

type Position = {
	x: number;
	y: number;
	price: number;
};

const useCopyMenu = (
	seriesRef: RefObject<ReturnType<IChartApi["addSeries"]> | null>
) => {
	const [position, setPosition] = useState<Position | null>(null);

	const closeMenu = () => setPosition(null);

	const handleCopyClick = (params: MouseEventParams<Time>) => setPosition((prev) => {
			if (params.point == null || prev != null || seriesRef.current == null) {
				return null;
			}

			const { point: { x, y } } = params;
			const price = seriesRef.current.coordinateToPrice(params.point!.y);
			if (!price) return null;

			return { x: x + 8, y: y + 8, price };
		});

	return {
		position,
		closeMenu,
		handleCopyClick,
	} as const;
};

export default useCopyMenu;