import type { UTCTimestamp } from "lightweight-charts";
import type { Timeframe } from "../../../shared/candles.types";

const useTimeframe = () => {
	const _reduce = (timeframe: Timeframe) => {
		const num = timeframe.match(/\d+/g)!.map(Number)[0];
		const txt = timeframe.match(/[a-z]+/gi)![0];
		return [num, txt] as [number, 's'|'h'|'m'];
	};

	const tfToNumber = (inp: Timeframe) => {
		const s = 1;
		const m = 60 * s;
		const h = 60 * m;

		const tfObj = { s, m, h };
		const [n, tf] = _reduce(inp);

		return n * tfObj[tf];
	};

	const normalizeEntry = <T extends { time: UTCTimestamp }>(
		entry: T, tf: Timeframe
	): T => {
		const { time } = entry;
		const frame = tfToNumber(tf);
		return {
			...entry,
			time: Math.floor(time / frame) * frame,
		};
	}

	const normalizeEntries = <T extends { time: UTCTimestamp }>(
		arr: T[], tf: Timeframe
	) => arr.map(o => normalizeEntry(o, tf));

	return {
		tfToNumber,
		normalizeEntry,
		normalizeEntries,
	};
};

export default useTimeframe;