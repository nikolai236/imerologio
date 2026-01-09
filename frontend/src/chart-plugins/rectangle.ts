import {
	type Coordinate,
	type Time,
	type IPrimitivePaneView,
	type IPrimitivePaneRenderer,
	type PrimitivePaneViewZOrder,
	type ISeriesPrimitiveAxisView,
	isBusinessDay
} from "lightweight-charts";
import { positionsBox, PluginBase, type ViewPoint, type Point } from "./plugin-base";
import { type CanvasRenderingTarget2D, } from 'fancy-canvas';

class RectanglePaneRenderer implements IPrimitivePaneRenderer {
	_p1: ViewPoint;
	_p2: ViewPoint;
	_fillColor: string;

	constructor(p1: ViewPoint, p2: ViewPoint, fillColor: string) {
		this._p1 = p1;
		this._p2 = p2;
		this._fillColor = fillColor;
	}

	public draw = (target: CanvasRenderingTarget2D) => {
		target.useBitmapCoordinateSpace((scope) => {
			if (this.nullPointExiists()) return;

			const { context, horizontalPixelRatio: hr, verticalPixelRatio: vr } = scope;

			const hp = positionsBox(this._p1.x!, this._p2.x!, hr);
			const vp = positionsBox(this._p1.y!, this._p2.y!, vr);

			context.fillStyle = this._fillColor;
			context.fillRect(hp.position, vp.position, hp.length, vp.length);
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

class RectanglePaneView implements IPrimitivePaneView {
	_source: Rectangle;
	_p1: ViewPoint = { x: null, y: null };
	_p2: ViewPoint = { x: null, y: null };

	constructor(source: Rectangle) {
		this._source = source;
	}

	public update() {
		const { series, chart, _p1, _p2 } = this._source;
		const timeScale = chart.timeScale();

		const y1 = series.priceToCoordinate(_p1.price);
		const y2 = series.priceToCoordinate(_p2.price);

		const x1 = timeScale.timeToCoordinate(_p1.time);
		const x2 = timeScale.timeToCoordinate(_p2.time);

		this._p1 = { x: x1, y: y1 };
		this._p2 = { x: x2, y: y2 };
	}

	public renderer() {
		return new RectanglePaneRenderer(
			this._p1,
			this._p2,
			this._source._options.fillColor
		);
	}

	zOrder(): PrimitivePaneViewZOrder {
		return 'top';
	}
}


class RectangleAxisPaneRenderer implements IPrimitivePaneRenderer {
	private _p1: number | null;
	private _p2: number | null;
	private _fillColor: string;
	private _vertical: boolean = false;

	constructor(
		p1: number | null,
		p2: number | null,
		fillColor: string,
		vertical: boolean
	) {
		this._p1 = p1;
		this._p2 = p2;
		this._fillColor = fillColor;
		this._vertical = vertical;
	}

	public draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace((scope) => {
			if (this._p1 == null || this._p2 == null) return;

			const { context } = scope;
			context.globalAlpha = 0.5;

			const r = this._vertical ? scope.verticalPixelRatio : scope.horizontalPixelRatio;
			const positions = positionsBox(this._p1, this._p2, r);

			context.fillStyle = this._fillColor;
			this.fillRect(context, positions.position, positions.length);
		});
	}

	private fillRect(context: CanvasRenderingContext2D, pos: number, length: number) {
		if (this._vertical) {
			context.fillRect(0, pos, 15, length);
		} else {
			context.fillRect(length, 0, pos, 15);
		}
	}
}

abstract class RectangleAxisPaneView implements IPrimitivePaneView {
	_source: Rectangle;
	_p1: number | null = null;
	_p2: number | null = null;
	_vertical: boolean = false;

	constructor(source: Rectangle, vertical: boolean) {
		this._source = source;
		this._vertical = vertical;
	}

	abstract getPoints(): [Coordinate | null, Coordinate | null];

	public update() {
		[this._p1, this._p2] = this.getPoints();
	}

	public renderer() {
		return new RectangleAxisPaneRenderer(
			this._p1,
			this._p2,
			this._source._options.fillColor,
			this._vertical
		);
	}
}

class RectanglePriceAxisPaneView extends RectangleAxisPaneView {
	getPoints(): [Coordinate | null, Coordinate | null] {
		const series = this._source.series;
		const y1 = series.priceToCoordinate(this._source._p1.price);
		const y2 = series.priceToCoordinate(this._source._p2.price);
		return [y1, y2];
	}
}

class RectangleTimeAxisPaneView extends RectangleAxisPaneView {
	getPoints(): [Coordinate | null, Coordinate | null] {
		const timeScale = this._source.chart.timeScale();
		const x1 = timeScale.timeToCoordinate(this._source._p1.time);
		const x2 = timeScale.timeToCoordinate(this._source._p2.time);
		return [x1, x2];
	}
}

abstract class RectangleAxisView implements ISeriesPrimitiveAxisView {
	protected _source: Rectangle;
	protected _p: Point;
	protected _pos: Coordinate | null = null;

	constructor(source: Rectangle, p: Point) {
		this._source = source;
		this._p = p;
	}

	public abstract update(): void;
	public abstract text(): string;

	public coordinate() {
		return this._pos ?? -1;
	}

	public visible(): boolean {
		return this._source._options.showLabels;
	}

	public tickVisible(): boolean {
		return this._source._options.showLabels;
	}

	public textColor() {
		return this._source._options.labelTextColor;
	}

	public backColor() {
		return this._source._options.labelColor;
	}

	public movePoint(p: Point) {
		this._p = p;
		this.update();
	}
}

class RectangleTimeAxisView extends RectangleAxisView {
	public update() {
		const timeScale = this._source.chart.timeScale();
		this._pos = timeScale.timeToCoordinate(this._p.time);
	}

	public text() {
		return this._source._options.timeLabelFormatter(this._p.time);
	}
}

class RectanglePriceAxisView extends RectangleAxisView {
	public update() {
		const series = this._source.series;
		this._pos = series.priceToCoordinate(this._p.price);
	}

	public text() {
		return this._source._options.priceLabelFormatter(this._p.price);
	}
}

export interface RectangleDrawingToolOptions {
	fillColor: string;
	previewFillColor: string;
	labelColor: string;
	labelTextColor: string;
	showLabels: boolean;
	priceLabelFormatter: (price: number) => string;
	timeLabelFormatter: (time: Time) => string;
}

export const defaultOptions: RectangleDrawingToolOptions = {
	fillColor: 'rgba(200, 50, 100, 0.75)',
	previewFillColor: 'rgba(200, 50, 100, 0.25)',
	labelColor: 'rgba(200, 50, 100, 1)',
	labelTextColor: 'white',
	showLabels: false,
	priceLabelFormatter: (price: number) => price.toFixed(2),
	timeLabelFormatter: (time: Time) => {
		if (typeof time == 'string') return time;
		const date = isBusinessDay(time)
			? new Date(time.year, time.month, time.day)
			: new Date(time * 1000);

		return date.toLocaleDateString();
	},
};

export default class Rectangle extends PluginBase {
	_options: RectangleDrawingToolOptions;
	_p1: Point;
	_p2: Point;
	_paneViews: RectanglePaneView[];
	_timeAxisViews: RectangleTimeAxisView[];
	_priceAxisViews: RectanglePriceAxisView[];
	_priceAxisPaneViews: RectanglePriceAxisPaneView[];
	_timeAxisPaneViews: RectangleTimeAxisPaneView[];

	constructor(
		p1: Point,
		p2: Point,
		options: Partial<RectangleDrawingToolOptions> = {}
	) {
		super();

		this._p1 = p1;
		this._p2 = p2;

		this._options = {
			...defaultOptions,
			...options,
		};

		this._paneViews = [new RectanglePaneView(this)];
		this._timeAxisViews = [
			new RectangleTimeAxisView(this, p1),
			new RectangleTimeAxisView(this, p2),
		];
		this._priceAxisViews = [
			new RectanglePriceAxisView(this, p1),
			new RectanglePriceAxisView(this, p2),
		];
		this._priceAxisPaneViews = [new RectanglePriceAxisPaneView(this, true)];
		this._timeAxisPaneViews = [new RectangleTimeAxisPaneView(this, false)];
	}

	public updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
		this._timeAxisViews.forEach(pw => pw.update());
		this._priceAxisViews.forEach(pw => pw.update());
		this._priceAxisPaneViews.forEach(pw => pw.update());
		this._timeAxisPaneViews.forEach(pw => pw.update());
	}

	public override paneViews() {
		return this._paneViews;
	}

	public applyOptions(options: Partial<RectangleDrawingToolOptions>) {
		this._options = { ...this._options, ...options };
		this.requestUpdate();
	}
}