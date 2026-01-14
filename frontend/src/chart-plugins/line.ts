import type { IPanePrimitivePaneView, IPrimitivePaneRenderer } from "lightweight-charts";
import type { CanvasRenderingTarget2D } from "fancy-canvas";
import { PluginBase, type ViewPoint, type Point, positionPoint } from "./plugin-base";

class LinePaneRenderer implements IPrimitivePaneRenderer {
	_p1: ViewPoint;
	_p2: ViewPoint;
	_stokeColor: string;

	constructor(p1: ViewPoint, p2: ViewPoint, color: string) {
		this._p1 = p1;
		this._p2 = p2;
		this._stokeColor = color;
	}

	public draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace((scope) => {
			if (this.nullPointExiists()) return;

			const { context, horizontalPixelRatio: hpr, verticalPixelRatio: vpr } = scope;

			const x1 = positionPoint(this._p1.x!, hpr);
			const y1 = positionPoint(this._p1.y!, vpr);
			const x2 = positionPoint(this._p2.x!, hpr);
			const y2 = positionPoint(this._p2.y!, vpr);

			context.strokeStyle = this._stokeColor;
			context.lineWidth = Math.max(1, Math.round(1 * scope.horizontalPixelRatio));

			context.save();
			context.beginPath();

			context.moveTo(x1, y1);
			context.lineTo(x2, y2);

			context.stroke();
			context.restore();
		});
	}

	private nullPointExiists() {
		return (
			this._p1.x == null ||
			this._p1.y == null ||
			this._p2.x == null ||
			this._p2.y == null
		);
	}
}

class LinePaneView implements IPanePrimitivePaneView {
	_p1: ViewPoint = { x: null, y: null};
	_p2: ViewPoint = { x: null, y: null };
	_source: Line;

	constructor(src: Line) {
		this._source = src;
	}

	public update() {
		const { series, chart, _p1, _p2 } = this._source;
		const timeScale = chart.timeScale();

		const x1 = timeScale.timeToCoordinate(_p1.time);
		const x2 = timeScale.timeToCoordinate(_p2.time);

		const y1 = series.priceToCoordinate(_p1.price);
		const y2 = series.priceToCoordinate(_p2.price);

		this._p1 = { x: x1, y: y1 };
		this._p2 = { x: x2, y: y2 };
	}

	public renderer() {
		return new LinePaneRenderer(
			this._p1,
			this._p2,
			this._source._options.stokeColor,
		);
	}
}

export interface LineDrawingToolOptions {
	stokeColor: string;
}

export const defaultOptions: LineDrawingToolOptions = {
	stokeColor: 'rgba(200, 50, 100, 0.75)',
};

export default class Line extends PluginBase {
	_p1: Point;
	_p2: Point;
	_options: LineDrawingToolOptions;
	_paneView: LinePaneView;

	constructor(
		p1: Point,
		p2: Point,
		options: Partial<LineDrawingToolOptions>
	) {
		super();

		this._p1 = p1;
		this._p2 = p2;

		this._options = { ...defaultOptions, ...options };
		this._paneView = new LinePaneView(this);
	}

	public updateAllViews() {
		this._paneView.update();
	}

	public override paneViews() {
		return [this._paneView];
	}
}