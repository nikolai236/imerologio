import type {
	SeriesAttachedParameter,
	Time,
	UTCTimestamp
} from "lightweight-charts";

import type { Entry, Exit } from "../../../shared/candles.types";
import type { OrderEnum } from "../../../shared/trades.types";

import { PluginBase, type Point } from "./plugin-base";
import Rectangle from "./rectangle";
import PriceLine from "./price-line";
import TextLabel from "./text-label";
import Triangle, { type TriangleDirection } from "./order-triangle";

export default class TradePosition extends PluginBase {
	private static readonly PROFIT_COLOR = "rgba(53, 183, 190, 0.2)";
	private static readonly LOSS_COLOR   = "rgba(210, 210, 210, 0.3)";
	private static readonly ENTRY_COLOR  = "rgb(47, 172, 255)";
	private static readonly EXIT_COLOR   = "rgb(0, 0, 0)";

	_entry: Entry;
	_exits: Exit[];
	_direction: OrderEnum;
	
	_stop: number;
	_target?: number;

	_exitTime: UTCTimestamp;

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
	}

	constructor(
		entries: Entry[],
		exits: Exit[],
		stop: number,
		direction: OrderEnum,
		target?: number,
	) {
		if (entries.length == 0 || exits.length == 0) {
			throw new Error("Invalid properties passed to TradePosition");
		}
		if (entries.length > 1) {
			throw new Error("Not implemented");
		}

		super();

		this._direction = direction;

		this._entry = entries[0];
		this._exits = exits;

		this._stop = stop;
		this._target = target;

		this._exitTime = exits.at(-1)!.time as UTCTimestamp;

		this.createEntryTriangle(this._entry);
		this._exits.forEach(this.createExitTriangle);

		this.createProfitRectangle();
		this.createStopRectangle();

		this._exits.forEach(this.createExitLine);
		this._exits.forEach(this.createExitLabel);
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

	private createOrderTriangle = ({ price, time }: Entry | Exit, color: string, dir: TriangleDirection) => {
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
			time: this._exitTime,
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
		const exitPrice = this.getEndPrice();
		if (
			(this._direction === "BUY" && this._entry.price < exitPrice) ||
			(this._direction === "SELL" && this._entry.price > exitPrice)
		) {
			p2 = {
				price: this.getEndPrice(),
				time: this._exitTime,
			};
		} else {
			if (this._target == null) return;
			p2 = {
				price: this._target,
				time: this._exitTime,
			};
		}

		this._children.profitRect = new Rectangle(p1, p2, {
			fillColor: TradePosition.PROFIT_COLOR,
		});
	}

	private getEndPrice = () => {
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
			this._exitTime as UTCTimestamp,
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

	public updateAllViews() {
		this.getChildren().forEach(c => c.updateAllViews());
	}

	public override attached(params: SeriesAttachedParameter<Time>): void {
		super.attached(params);

		this.getChildren().forEach(c => c.attached(params));
	}

	public override detached(){
		super.detached();

		this.getChildren().forEach(c => c.detached);
	}

	public paneViews() {
		return this.getChildren().map(c => c.paneViews()).flat();
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
}