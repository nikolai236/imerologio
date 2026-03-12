import type { IPanePrimitivePaneView, IPrimitivePaneRenderer } from "lightweight-charts";
import type { CanvasRenderingTarget2D } from "fancy-canvas";
import { PluginBase, type ViewPoint, type Point, positionPoint } from "./plugin-base";
import type { ChartLine } from "../../../shared/trades.types";

class LinePaneRenderer implements IPrimitivePaneRenderer {
	_p1: ViewPoint;
	_p2: ViewPoint;
	_stokeColor: string;
	_selected: boolean;

	constructor(p1: ViewPoint, p2: ViewPoint, color: string, selected: boolean) {
		this._p1 = p1;
		this._p2 = p2;
		this._stokeColor = color;
		this._selected = selected;
	}

	public draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace((scope) => {
			if (this.nullPointExiists()) return;

			const { context, horizontalPixelRatio: hpr, verticalPixelRatio: vpr } = scope;

			const x1 = positionPoint(this._p1.x!, hpr);
			const y1 = positionPoint(this._p1.y!, vpr);
			const x2 = positionPoint(this._p2.x!, hpr);
			const y2 = positionPoint(this._p2.y!, vpr);

			const normalWidth = Math.max(1, Math.round(1 * hpr));
			const highlightWidth = Math.max(normalWidth + 4, Math.round(5 * hpr));

			context.save();
			context.beginPath();
			context.moveTo(x1, y1);
			context.lineTo(x2, y2);

			if (this._selected) {
				context.strokeStyle = "rgba(0, 120, 255, 0.45)";
				context.lineWidth = highlightWidth;
				context.lineCap = "round";
				context.lineJoin = "round";
				context.stroke();
			}

			context.beginPath();
			context.moveTo(x1, y1);
			context.lineTo(x2, y2);
			context.strokeStyle = this._stokeColor;
			context.lineWidth = normalWidth;
			context.lineCap = "round";
			context.lineJoin = "round";
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
	_p1: ViewPoint = { x: null, y: null };
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
			this._source.selected,
		);
	}
}

export interface LineDrawingToolOptions {
	stokeColor: string;
}

export const defaultOptions: LineDrawingToolOptions = {
	stokeColor: "rgba(200, 50, 100, 0.75)",
};

export default class Line extends PluginBase {
	_p1: Point;
	_p2: Point;
	_options: LineDrawingToolOptions;
	_paneView: LinePaneView;

	selected: boolean;

	constructor(
		p1: Point,
		p2: Point,
		options?: Partial<LineDrawingToolOptions>
	) {
		super();

		this._p1 = p1;
		this._p2 = p2;
		this.selected = false;

		this._options = { ...defaultOptions, ...options };
		this._paneView = new LinePaneView(this);
	}

	public isNearPoint(px: number, py: number, threshold = 6) {
		const x1 = this._paneView._p1.x;
		const y1 = this._paneView._p1.y;

		const x2 = this._paneView._p2.x;
		const y2 = this._paneView._p2.y;

		if (x1 == null || y1 == null || x2 == null || y2 == null) {
			return false;
		}

		const dx = x2  - x1;
		const dy = y2 - y1;

		if (dx == 0 && dy == 0) {
			return Math.hypot(px - x1, py - y1) <= threshold;
		}

		const t = Math.max(
			0,
			Math.min(
				1,
				((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
			),
		);

		const projX = x1 + t * dx;
		const projY = y1 + t * dy;

		return Math.hypot(px - projX, py - projY) <= threshold;
	}

	public serialize(): ChartLine {
		const p1 = { time: this._p1.time as number, price: this._p1.price };
		const p2 = { time: this._p2.time as number, price: this._p2.price };

		return [p1, p2];
	}

	public setSecondPoint(p2: Point) {
		this._p2 = p2;
		this.updateAllViews();
		this.requestUpdate();
	}

	public setSelected(selected: boolean) {
		this.selected = selected;
		this.updateAllViews();
		this.requestUpdate();
	}

	public select() {
		this.setSelected(true);
	}

	public deselect() {
		this.setSelected(false);
	}

	public updateAllViews() {
		this._paneView.update();
	}

	public override paneViews() {
		return [this._paneView];
	}
}