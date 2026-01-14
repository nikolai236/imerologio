import type {
  IPrimitivePaneRenderer,
  IPanePrimitivePaneView,
} from "lightweight-charts";
import { positionPoint, PluginBase, type Point, type ViewPoint } from "./plugin-base";
import type { CanvasRenderingTarget2D } from "fancy-canvas";

class TextLabelRenderer implements IPrimitivePaneRenderer {
	private _p: ViewPoint;
	private _text: string;

	constructor(p: ViewPoint, text: string) {
		this._p = p;
		this._text = text;
	}

	public draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace((scope) => {
			if (this._p.x == null || this._p.y == null) return;

			const { context, horizontalPixelRatio: hr, verticalPixelRatio: vr } = scope;

			const x = positionPoint(this._p.x, hr);
			const y = positionPoint(this._p.y, vr);

			context.fillStyle = "#000";
			context.font = `${10 * vr}px Arial`;
			context.textBaseline = "middle";

			context.fillText(this._text, x + 6 * hr, y);
		});
	}
}

class TextLabelPaneView implements IPanePrimitivePaneView {
	_p: ViewPoint = { x: null, y: null};
	_source: TextLabel;

	constructor(src: TextLabel) {
		this._source = src;
	}

	public update() {
		const { series, chart, _p } = this._source;
		const timeScale = chart.timeScale();

		const x = timeScale.timeToCoordinate(_p.time);
		const y = series.priceToCoordinate(_p.price);

		this._p = { x, y };
	}

	public renderer() {
		return new TextLabelRenderer(
			this._p,
			this._source._text
		);
	}
}

export default class TextLabel extends PluginBase {
	_p: Point;
	_text: string
	_paneView: TextLabelPaneView;

	constructor(p: Point, text: string) {
		super();

		this._p = p;
		this._text = text;

		this._paneView = new TextLabelPaneView(this);
	}

	public updateAllViews() {
		this._paneView.update();
	}

	public override paneViews() {
		return [this._paneView];
	}
}
