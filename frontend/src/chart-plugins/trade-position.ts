import type {
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
	SeriesAttachedParameter,
	Time,
	UTCTimestamp
} from "lightweight-charts";

import type { Entry, Exit } from "../../../shared/candles.types";
import type { OrderEnum } from "../../../shared/trades.types";

import { PluginBase, positionPoint, type Point } from "./plugin-base";
import Rectangle from "./rectangle";
import PriceLine from "./price-line";
import TextLabel from "./text-label";
import Triangle, { type TriangleDirection } from "./order-triangle";
import type { CanvasRenderingTarget2D } from "fancy-canvas";

type ScreenBox = {
	left: number;
	right: number;
	mid: number;
	top: number;
	bottom: number;
};

export type ResizeHandle = keyof ScreenBox | null;

class TradePositionSelectionRenderer implements IPrimitivePaneRenderer {
	private _box: ScreenBox | null;
	private _selected: boolean;

	constructor(box: ScreenBox | null, selected: boolean) {
		this._box = box;
		this._selected = selected;
	}

	draw(target: CanvasRenderingTarget2D) {
		if (!this._selected || !this._box) return;

		target.useBitmapCoordinateSpace((scope) => {
			const { context, horizontalPixelRatio: hpr, verticalPixelRatio: vpr } = scope;

			const left = positionPoint(this._box!.left, hpr);
			const right = positionPoint(this._box!.right, hpr);
			const top = positionPoint(this._box!.top, vpr);
			const bottom = positionPoint(this._box!.bottom, vpr);

			const normalWidth = Math.max(1, Math.round(1 * hpr));
			const highlightWidth = Math.max(normalWidth + 1, Math.round(hpr));

			context.save();
			context.beginPath();

			context.moveTo(left, top);
			context.lineTo(right, top);

			context.moveTo(left, bottom);
			context.lineTo(right, bottom);

			context.moveTo(left, top);
			context.lineTo(left, bottom);

			context.moveTo(right, top);
			context.lineTo(right, bottom);

			context.strokeStyle = "rgba(0, 120, 255, 0.45)";
			context.lineWidth = highlightWidth;
			context.lineCap = "round";
			context.lineJoin = "round";
			context.stroke();

			context.restore();
		});
	}
}

class TradePositionSelectionPaneView implements IPrimitivePaneView {
	private _source: TradePosition;
	private _box: ScreenBox | null = null;

	constructor(source: TradePosition) {
		this._source = source;
	}

	update() {
		this._box = this._source.getScreenBox();
	}

	renderer() {
		return new TradePositionSelectionRenderer(
			this._box,
			this._source.selected,
		);
	}

	zOrder(): PrimitivePaneViewZOrder {
		return "top";
	}
}

export default class TradePosition extends PluginBase {
	private static readonly PROFIT_COLOR = "rgba(53, 183, 190, 0.2)";
	private static readonly LOSS_COLOR   = "rgba(210, 210, 210, 0.3)";
	private static readonly ENTRY_COLOR  = "rgb(47, 172, 255)";
	private static readonly EXIT_COLOR   = "rgb(0, 0, 0)";
	private static readonly HANDLE_TOLERANCE_PX = 8;

	_tempId?: string;
	selected = false;

	_entry: Entry & { tempId?: string };
	_exits: (Exit & { tempId?: string })[];
	_direction: OrderEnum;
	
	_stop: number;
	_target?: number;

	_children: {
		stopRect?: Rectangle;
		profitRect?: Rectangle;

		exitLines: PriceLine[];
		exitLabels: TextLabel[];

		triangles: Triangle[];
	} = {
		exitLines: [],
		exitLabels: [],
		triangles: [],
	};

	_selectionView: TradePositionSelectionPaneView;

	constructor(
		entries: Entry[],
		exits: Exit[],
		stop: number,
		direction: OrderEnum,
		target?: number,
		tempId?: string,
	) {
		if (entries.length == 0 || exits.length == 0) {
			throw new Error("Invalid properties passed to TradePosition");
		}

		if (entries.length > 1) {
			throw new Error("Not implemented");
		}

		super();

		this._tempId = tempId;

		this._direction = direction;

		this._entry = entries[0];
		this._exits = exits;

		this._stop = stop;
		this._target = target;

		this.createEntryTriangle(this._entry);
		this._exits.forEach(this.createExitTriangle);

		this.createProfitRectangle();
		this.createStopRectangle();

		this._exits.forEach(this.createExitLine);
		this._exits.forEach(this.createExitLabel);

		this._selectionView = new TradePositionSelectionPaneView(this);
	}

	private createEntryTriangle = (entry: Entry) => {
		this.createOrderTriangle(
			entry,
			TradePosition.ENTRY_COLOR,
			this._direction === "BUY" ? "up" : "down",
		);
	};

	private createExitTriangle = (exit: Exit) => {
		this.createOrderTriangle(
			exit,
			TradePosition.EXIT_COLOR,
			this._direction === "BUY" ? "down" : "up",
		);
	};

	private createOrderTriangle = (
		{ price, time }: Entry | Exit,
		color: string,
		dir: TriangleDirection
	) => {
		const p = { price, time: time as UTCTimestamp };

		this._children.triangles.push(
			new Triangle(p, dir, { color })
		);
	}

	private createStopRectangle = () => {
		const p1 = {
			price: this._entry.price,
			time: this._entry.time as UTCTimestamp,
		};

		const p2 = {
			price: this._stop,
			time: this.getExitTime(),
		};

		this._children.stopRect = new Rectangle(p1, p2, {
			fillColor: TradePosition.LOSS_COLOR,
		});
	}

	private createProfitRectangle = () => {
		const p1 = {
			price: this._entry.price,
			time: this._entry.time as UTCTimestamp,
		};

		let p2: Point;
		const exitPrice = this.getBestExitPrice();
		if (
			(this._direction === "BUY" && this._entry.price < exitPrice) ||
			(this._direction === "SELL" && this._entry.price > exitPrice)
		) {
			p2 = {
				price: this.getBestExitPrice(),
				time: this.getExitTime(),
			};
		} else {
			if (this._target == null) return;
			p2 = {
				price: this._target,
				time: this.getExitTime(),
			};
		}

		this._children.profitRect = new Rectangle(p1, p2, {
			fillColor: TradePosition.PROFIT_COLOR,
		});
	}

	private getBestExitPrice() {
		const prices = this._exits.map(e => e.price);

		if (this._direction == 'BUY') {
			return Math.max(...prices);
		} else {
			return Math.min(...prices);
		}
	}

	private createExitLine = (exit: Exit) => {
		const line = new PriceLine(
			this._entry.time as UTCTimestamp,
			this.getExitTime(),
			exit.price,
			{ stokeColor: 'rgba(45, 117, 42, 0.84)', }
		);

		this._children.exitLines.push(line);
	}

	private createExitLabel = ({ price, time }: Exit, i: number) => {
		const p = { price, time: time as UTCTimestamp };
		const label = new TextLabel(p, `exit #${i+1}`);
		this._children.exitLabels.push(label);
	}

	private getChildren = (): PluginBase[] => {
		return [
			this._children.profitRect!,
			this._children.stopRect!,
			...this._children.exitLines,
			...this._children.exitLabels,
			...this._children.triangles,
		];
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

	public getTempId() {
		return this._tempId!;
	}

	public getExits() {
		return this._exits;
	}

	public getEntryTime() {
		const { time } = this._entry;
		return time as UTCTimestamp;
	}

	public getExitTime() {
		const last = this._exits.at(-1)!;
		return last.time as UTCTimestamp;
	}

	public getBestExit() {
		const price  = this.getBestExitPrice();
		const [exit] = this._exits.filter(e => e.price === price);
		return exit;
	}

	public setStop(stop: number) {
		if (this._direction == "BUY" && stop >= this._entry.price) {
			return null;
		}

		if (this._direction == "SELL" && stop <= this._entry.price) {
			return null;
		}

		const isPriceBeyondStop = ({ price }: Exit) =>
			this._direction === "BUY"
				? price < stop
				: price > stop;

		this._exits
			.filter(isPriceBeyondStop)
			.forEach((e) => {
				e.price = stop;
			});

		this._stop = stop;
		return this._exits;
	}

	public setTarget(target: number) {
		if (this._direction == "BUY" && target <= this._entry.price) {
			return null;
		}

		if (this._direction == "SELL" && target >= this._entry.price) {
			return null;
		}

		this._target = target;

		const isPriceBeyondTarget = ({ price }: Exit) =>
			this._direction === "BUY"
				? price > target
				: price < target;

		this._exits
			.filter(isPriceBeyondTarget)
			.forEach((e) => {
				e.price = target;
			});

		const bestPrice = this.getBestExitPrice();
		this._exits
			.filter(e => e.price === bestPrice)
			.forEach(e => {
				e.price = target;
			});

		return this._exits;
	}

	public setExitTime(exitTime: number) {
		if (exitTime <= this.getEntryTime()) {
			return null;
		}

		this._exits
			.filter(({ time }) => time > exitTime)
			.forEach(e => {
				e.time = exitTime;
			});

		const maxTime = this._exits.at(-1)!.time;
		this._exits
			.filter(e => e.time === maxTime)
			.forEach(e => {
				e.time = exitTime;
			})

		return this._exits;
	}

	public setEntryTime(time: number) {
		if (time >= this.getExitTime()) {
			return null;
		}

		this._entry.time = time;
		return this._entry;
	}

	public setEntryPrice(price: number) {
		const target = Math.max(
			this._target ?? 0,
			this.getBestExitPrice(),
		);

		if (
			this._direction === "BUY" &&
			(price >= target || price <= this._stop)
		) return null;

		if (
			this._direction === "SELL" &&
			(price <= target || price >= this._stop)
		) return null;

		this._entry.price = price;
		return this._entry;
	}

	public updateAllViews() {
		this.getChildren().forEach(c => c.updateAllViews());
		this._selectionView.update();
	}

	public override attached(params: SeriesAttachedParameter<Time>): void {
		super.attached(params);

		this.getChildren().forEach(c => c.attached(params));
	}

	public override detached() {
		super.detached();

		this.getChildren().forEach(c => c.detached());
	}

	public paneViews() {
		return [
			...this.getChildren().map(c => c.paneViews()).flat(),
			this._selectionView,
		];
	}

	public priceAxisViews() {
		return this.getChildren().map(c => c.priceAxisViews()).flat();
	}

	public timeAxisViews() {
		return this.getChildren().map(c => c.timeAxisViews()).flat();
	}

	public priceAxisPaneViews() {
		return this.getChildren().map(c => c.priceAxisPaneViews()).flat();
	}

	public timeAxisPaneViews() {
		return this.getChildren().map(c => c.timeAxisPaneViews()).flat();
	}

	public getScreenBox(): ScreenBox | null {
		const chart = this._chart;
		const series = this._series;

		if (!series || !chart || this._exits.length == 0) return null;

		const timeScale = chart.timeScale();

		const entryTime = this._entry.time as UTCTimestamp;
		const x1 = timeScale.timeToCoordinate(entryTime);

		const exitTime = this._exits.at(-1)!.time as UTCTimestamp;
		const x2 = timeScale.timeToCoordinate(exitTime);

		if (x1 == null || x2 == null) return null;

		const entryPrice = this._entry.price;
		const entryY = series.priceToCoordinate(entryPrice);

		const stopY = series.priceToCoordinate(this._stop);

		const target = this._target ?? this.getBestExitPrice();
		const targetY = series.priceToCoordinate(target);

		if (stopY == null || targetY == null || entryY == null) {
			return null;
		}

		return {
			left: Math.min(x1, x2),
			right: Math.max(x1, x2),
			mid: entryY,
			top: targetY,
			bottom: stopY,
		};
	}

	public hitTestResizeHandle(x: number, y: number): ResizeHandle {
		const box = this.getScreenBox();
		if (!box) return null;

		const tol = TradePosition.HANDLE_TOLERANCE_PX;

		if (!this.isPointInside(x, y)) return null;

		const onTop = Math.abs(y - box.top) <= tol;
		const onBottom = Math.abs(y - box.bottom) <= tol;
		const onLeft = Math.abs(x - box.left) <= tol;
		const onRight = Math.abs(x - box.right) <= tol;
		const onMid = Math.abs(y - box.mid) <= tol;

		if (onTop) return "top";
		if (onBottom) return "bottom";
		if (onLeft) return "left";
		if (onRight) return "right";
		if (onMid) return "mid";

		return null;
	}

	public isPointInside(x: number, y: number) {
		const chart = this._chart;
		const series = this._series;

		if (!series || !chart) return false;

		const timeScale = chart.timeScale();

		const entryTime = this._entry.time as UTCTimestamp;
		const x1 = timeScale.timeToCoordinate(entryTime);

		const exitTime = this._exits.at(-1)!.time as UTCTimestamp;
		const x2 = timeScale.timeToCoordinate(exitTime);

		if (x1 == null || x2 == null) return false;

		const y1 = series.priceToCoordinate(this._stop);

		const target = this._target ?? this.getBestExitPrice();
		const y2 = series.priceToCoordinate(target);

		if (y1 == null || y2 == null) return false;

		const [z1, z2] = [y1, y2].sort((a, b) => a - b);
		return x >= x1 && x <= x2 && y >= z1 && y <= z2;
	}

	public containsPoint(x: number, y: number) {
		const box = this.getScreenBox();
		if (!box) return false;

		return (
			x >= box.left &&
			x <= box.right &&
			y >= box.top &&
			y <= box.bottom
		);
	}
}