import { Candle, Timeframe } from "../../../shared/candles.types";

const useCandleService = () => {
	const _reduce = (timeframe: Timeframe) => {
		const num = timeframe.match(/\d+/g)!.map(Number)[0];
		const txt = timeframe.match(/[a-z]+/gi)![0];
		return [num, txt] as [number, 's'|'h'|'m'];
	};

	const _aggregateCandle = (frame: number, bucket: number, ret: Candle[], candle: Candle) => {
		const currBucket = Math.floor(candle.time / frame);

		if (bucket != currBucket) {
			ret.push({ ...candle, time: currBucket * frame });
			return currBucket;
		}

		const curr = ret[ret.length - 1];

		curr.high = Math.max(curr.high, candle.high);
		curr.low  = Math.min(curr.low, candle.low);

		curr.close = candle.close;
		curr.volume += candle.volume;

		return bucket;
	}

	const tfToNumber = (inp: Timeframe) => {
		const s = 1000;
		const m = 60 * s;
		const h = 60 * m;

		const tfObj = { s, m, h };
		const [n, tf] = _reduce(inp);

		return n * tfObj[tf];
	};

	const validateCandleLength = (diff: number, timeframe: Timeframe) => {
		const frame = tfToNumber(timeframe);
		const count = diff / frame;
		return count < 25_000;
	};

	const setTimeFrame = (candles: Candle[], tf: Timeframe) => {
		const frame = tfToNumber(tf);
		if (frame < 15_000){
			throw new Error("Timeframe not supported");
		}

		const ret: Candle[] = [];
		let bucket = -1;

		for (const candle of candles) {
			bucket = _aggregateCandle(frame, bucket, ret, candle);
		}

		return ret;
	};

	return {
		setTimeFrame,
		tfToNumber,
		validateCandleLength,
	};
};

export default useCandleService;