import type { UTCTimestamp } from "lightweight-charts";
import Line, { type LineDrawingToolOptions } from "./line"

export default class PriceLine extends Line {
	constructor(
		time1: UTCTimestamp,
		time2: UTCTimestamp,
		price: number,
		options:Partial<LineDrawingToolOptions>
	) {
		const p1 = { time: time1, price };
		const p2 = { time: time2 , price };

		super(p1, p2, options);
	}
}