import Rectangle from "./rectangle";
import { PluginBase, type Point } from "./plugin-base";
import type { Entry, Exit } from "../../../shared/candles.types";
import type { SeriesAttachedParameter, Time, UTCTimestamp } from "lightweight-charts";
import PriceLine from "./price-line";
import type { OrderEnum } from "../../../shared/trades.types";
import TextLabel from "./text-label";

export default class TradePosition extends PluginBase {
	_entry: Entry;
	_exits: Exit[];
	_direction: OrderEnum;
	
	_stop: number;
	_target?: number;

	_exitTime: UTCTimestamp;

	_stopRect?: Rectangle;
	_profitRect?: Rectangle;

	_exitLines: PriceLine[];
	_exitLabels: TextLabel[];

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

		this._exitLines = [];
		this._exitLabels = [];

		this.createProfitRectangle();
		this.createStopRectangle();

		this._exits.forEach(this.createExitLine);
		this._exits.forEach(this.createExitLabel);
	}

	private createStopRectangle = () => {
		const p1 = {
			price: this._entry.price, time: this._entry.time as UTCTimestamp,
		};

		const p2 = {
			price: this._stop, time: this._exitTime
		};

		this._stopRect = new Rectangle(p1, p2, {
			fillColor: 'rgba(216, 44, 67, 0.50)',
		});
	}

	private createProfitRectangle = () => {
		const p1 = {
			price: this._entry.price, time: this._entry.time as UTCTimestamp,
		};

		const p2 = { price: this.getEndPrice(), time: this._exitTime };

		this._profitRect = new Rectangle(p1, p2, {
			fillColor: 'rgba(107, 202, 104, 0.50)',
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

		this._exitLines.push(line);
	}

	private createExitLabel = ({ price, time }: Exit, i: number) => {
		const p = { price, time: time as UTCTimestamp };
		const label = new TextLabel(p, `exit #${i+1}`);
		this._exitLabels.push(label);
	}

	public updateAllViews() {
		this._stopRect?.updateAllViews();
		this._profitRect?.updateAllViews();

		this._exitLines.forEach(e => e.updateAllViews());
		this._exitLabels.forEach(e => e.updateAllViews());
	}

	public override attached(params: SeriesAttachedParameter<Time>): void {
		super.attached(params);

		this._stopRect?.attached(params);
		this._profitRect?.attached(params);

		this._exitLines.forEach(e => e.attached(params));
		this._exitLabels.forEach(e => e.attached(params));
	}

	public override detached(){
		super.detached();

		this._stopRect?.detached();
		this._profitRect?.detached();

		this._exitLines.forEach(e => e.detached());
		this._exitLabels.forEach(e => e.detached());
	}

	public paneViews() {
		return [
			...this._stopRect!.paneViews(),
			...this._profitRect!.paneViews(),
			...this._exitLines.map(e => e.paneViews()).flat(),
			...this._exitLabels.map(e => e.paneViews()).flat(),
		];
	}

	public priceAxisViews() {
		return [
			...this._stopRect!.priceAxisViews(),
			...this._profitRect!.priceAxisViews(),
			...this._exitLines.map(e => e.priceAxisViews()).flat(),
			...this._exitLabels.map(e => e.priceAxisViews()).flat()
		];
	}

	public timeAxisViews() {
		return [
			...this._stopRect!.timeAxisViews(),
			...this._profitRect!.timeAxisViews(),
			...this._exitLines.map(e => e.timeAxisViews()).flat(),
			...this._exitLabels.map(e => e.timeAxisViews()).flat(),
		];
	}

	public priceAxisPaneViews() {
		return [
			...this._stopRect!.priceAxisPaneViews(),
			...this._profitRect!.priceAxisPaneViews(),
			...this._exitLines.map(e => e.priceAxisPaneViews()).flat(),
			...this._exitLabels.map(e => e.priceAxisPaneViews()).flat()
		];
	}

	public timeAxisPaneViews() {
		return [
			...this._stopRect!.timeAxisPaneViews(),
			...this._profitRect!.timeAxisPaneViews(),
			...this._exitLines.map(e => e.timeAxisPaneViews()).flat(),
			...this._exitLabels.map(e => e.timeAxisPaneViews()).flat(),
		];
	}
}