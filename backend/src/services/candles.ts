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

	const numberToTf = (inp: number) => {
		const tfs = Object.values(Timeframe);
		const ret = tfs.find(tf => tfToNumber(tf) == inp);

		if (ret == null) {
			const msg = "Number is not a suppported timeframe";
			throw new Error(msg);
		}
		return ret;
	};

	const isCandleLengthValid = (diff: number, timeframe: Timeframe) => {
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

	const _createInsertArr = (baseTime: number, n: number, frame: number) => {
		const ret = new Array(n).fill(null);
		return ret.map((_, i) =>
			({ time: baseTime + (i + 1) * frame })
		);
	};

	const fillBlanks = (candles: Candle[], frame: number) => {
		if (candles.length < 2) return [];

		for (let i = 1; i < candles.length; i++) {

			const diff = candles[i].time - candles[i-1].time;
			if (diff <= frame) continue;

			const missing = Math.floor(diff / frame) - 1;
			const time = candles[i-1].time;

			const toInsert = _createInsertArr(time, missing, frame);
			candles.splice(i, 0, ...toInsert as Candle[]);

			i += missing;
		}

		return candles;
	}

	return {
		fillBlanks,
		setTimeFrame,
		tfToNumber,
		numberToTf,
		isCandleLengthValid,
	};
};

export default useCandleService;