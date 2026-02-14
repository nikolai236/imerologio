import type { MouseEventParams, Time } from "lightweight-charts";
import { useState } from "react";

type Position = {
	x: number;
	y: number;
	price: number;
};

const useCopyMenu = () => {
	const [position, setPosition] = useState<Position | null>(null);

	const destroyPosition = () => {
		setPosition(null)
	};

	const onClick = (getPrice: (p: MouseEventParams) => number) =>
		(param: MouseEventParams<Time>) => setPosition((prev) => {
			if (param.point == null || prev != null) {
				return null;
			}

			const price = getPrice(param);
			if (!price) return null;

			return {
				x: param.point.x + 8,
				y: param.point.y + 8,
				price,
			};
		});

	return { position, destroyPosition, onClick };
};

export default useCopyMenu;