import {
	MismatchDirection,
	type CandlestickData,
	type IPrimitivePaneRenderer,
	type IPrimitivePaneView,
	type ISeriesApi,
	type PrimitivePaneViewZOrder,
	type SeriesOptionsMap,
	type Time,
	type UTCTimestamp
} from "lightweight-charts";
import {
	PluginBase,
	positionPoint,
	type Point,
	type ViewPoint
} from "./plugin-base";
import type { CanvasRenderingTarget2D } from 'fancy-canvas';

export type TriangleDirection = "up" | "down";

export interface TriangleOptions {
	color: string;
	sizePx: number;
	offsetPx: number;
	zOrder: PrimitivePaneViewZOrder;
}

export const defaultTriangleOptions: TriangleOptions = {
	color: "rgba(30, 200, 120, 0.95)",
	sizePx: 10,
	offsetPx: 20,
	zOrder: "top",
};

class TrianglePaneRenderer implements IPrimitivePaneRenderer {
	private static WIDTH_FACTOR = 0.9;

	private _p: ViewPoint;
	private _direction: TriangleDirection;
	private _color: string;
	private _sizePx: number;
	private _offsetPx: number;

	constructor(
		p: ViewPoint,
		direction: TriangleDirection,
		color: string,
		sizePx: number,
		offsetPx: number
	) {
		this._p = p;
		this._direction = direction;
		this._color = color;
		this._sizePx = sizePx;
		this._offsetPx = offsetPx;
	}

	public draw = (target: CanvasRenderingTarget2D) => {
		target.useBitmapCoordinateSpace((scope) => {
			let { x, y } = this._p;
			if (x == null || y == null) return;

			const {
				context,
				horizontalPixelRatio: hr,
				verticalPixelRatio: vr
			} = scope;

			const px = positionPoint(x, hr);
			const py = positionPoint(y, vr);

			const mult = this._direction == "up" ? 1 : -1;
			const size = this._sizePx * mult;

			const halfWidth = this._sizePx * TrianglePaneRenderer.WIDTH_FACTOR;
			const cy = py + this._offsetPx * mult;

			context.beginPath();

			context.moveTo(px, cy - size);
			context.lineTo(px - halfWidth, cy + size);
			context.lineTo(px + halfWidth, cy + size);

			context.closePath();
			context.fillStyle = this._color;
			context.fill();
		});
	}
};

type CandleSeries = ISeriesApi<
	keyof SeriesOptionsMap,
	Time,
	CandlestickData<UTCTimestamp>
>;

class TrianglePaneView implements IPrimitivePaneView {
	private _source: OrderTrangle;
	private _p: ViewPoint = { x: null, y: null };

	constructor(source: OrderTrangle) {
		this._source = source;
	}

	public update() {
		const { chart, series, _p } = this._source;
		const timeScale = chart.timeScale();

		const idx = timeScale.timeToIndex(_p.time);
		if (idx == null) {
			this._p = { x: null, y: null };
			return;
		}

		const bar = (series as CandleSeries)
			.dataByIndex(idx, MismatchDirection.NearestLeft);

		if (bar == null) {
			this._p = { x: null, y: null };
			return;
		}

		const anchor = this._source._direction === "up" ?
			bar.low : bar.high;

		const x = timeScale.timeToCoordinate(bar.time);
		const y = series.priceToCoordinate(anchor);

		this._p = { x, y };
	}

	public renderer() {
		return new TrianglePaneRenderer(
			this._p,
			this._source._direction,
			this._source._options.color,
			this._source._options.sizePx,
			this._source._options.offsetPx
		);
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return this._source._options.zOrder;
	}
}

export default class OrderTrangle extends PluginBase {
	_p: Point;
	_direction: TriangleDirection;
	_options: TriangleOptions;
	_paneView: TrianglePaneView;

	constructor(
		p: Point,
		direction: TriangleDirection,
		options: Partial<TriangleOptions> = {}
	) {
		super();

		this._p = p;
		this._direction = direction;

		this._options = {
			...defaultTriangleOptions,
			...options,
		};

		this._paneView = new TrianglePaneView(this);
	}

	public updateAllViews(): void {
		this._paneView?.update();
	}

	public override paneViews(): IPrimitivePaneView[] {
		return [this._paneView];
	}
}