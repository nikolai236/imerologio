import { type Candle, type Timeframe, Timeframes } from "../../../shared/candles.types";

const MAX_CANDLE_COUNT = 25_000;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const ET_TZ = "America/New_York";

const startOfDayCache = new Map<string, number>();

const etFormatter = new Intl.DateTimeFormat("en-US", {
	timeZone: ET_TZ,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	weekday: "short",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hourCycle: "h23",
});

const extractParts = (time: number) => {
	const parts: Record<string, string> = {};
	const pairs = etFormatter.formatToParts(new Date(time));

	for (const { type, value } of pairs) {
		parts[type] = value;
	}

	return parts;
};

const getEtOffset = (time: number): number => {
	const parts = extractParts(time);

	const asIfUtc = Date.UTC(
		Number(parts["year"]),
		Number(parts["month"]) - 1,
		Number(parts["day"]),
		Number(parts["hour"]),
		Number(parts["minute"]),
		Number(parts["second"]),
	);

	return asIfUtc - time;
};

const getEtDateParts = (time: number) => {
	const parts = extractParts(time);

	return {
		year: Number(parts["year"]),
		month: Number(parts["month"]),
		day: Number(parts["day"]),
		weekday: parts["weekday"],
	};
};

const getEtWeekdayIndex = (time: number) => {
	const { weekday } = getEtDateParts(time);

	const map: Record<string, number> = {
		Mon: 0,
		Tue: 1,
		Wed: 2,
		Thu: 3,
		Fri: 4,
		Sat: 5,
		Sun: 6,
	};

	return map[weekday];
};

const getEtStartOfDay = (timeSec: number) => {
	const { year, month, day } = getEtDateParts(timeSec);
	const key = `${year}-${month}-${day}`;

	const cached = startOfDayCache.get(key);
	if (cached != null) return cached;

	const naiveUtcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
	const offset = getEtOffset(naiveUtcMidnight);

	const start = naiveUtcMidnight - offset;
	startOfDayCache.set(key, start);

	return start;
};

const getEtStartOfWeek = (time: number) => {
	const { year, month, day } = getEtDateParts(time);
	const weekday = getEtWeekdayIndex(time);

	const mondayUtcGuess = Date.UTC(
		year, month - 1, day - weekday, 0, 0, 0, 0
	);

	return getEtStartOfDay(mondayUtcGuess);
};

const reduceTf = (timeframe: Timeframe) => {
	const num = timeframe.match(/\d+/g)!.map(Number)[0];
	const txt = timeframe.match(/[a-z]+/gi)![0];
	return [num, txt] as [number, 's'|'h'|'m'];
};

const aggregateInto = (src: Candle, dest: Candle) => {
	dest.high = Math.max(dest.high, src.high);
	dest.low  = Math.min(dest.low, src.low);
	dest.close = src.close;
	dest.volume += src.volume;
};

function aggregateHTFCandles(
	candles: Candle[],
	checkThreshold: number,
	getStart: (time: number) => number,
) {
	if (candles.length === 0) return [];

	let currentStart = -1;
	let nextCheckStart = currentStart + checkThreshold;

	const aggregated: Candle[] = [];

	const aggregate = (candle: Candle) =>
		aggregateInto(candle, aggregated[aggregated.length - 1]);

	for (const candle of candles) {
		if (currentStart !== -1 && candle.time < nextCheckStart) {
			aggregate(candle);
			continue;
		}

		const newStart = getStart(candle.time);
		if (newStart === currentStart) {
			aggregate(candle);
			continue;
		}

		aggregated.push({
			...candle,
			time: newStart,
		});

		currentStart = newStart;
		nextCheckStart = currentStart + checkThreshold;
	}

	return aggregated;
}

export function tfToNumber(inp: Timeframe) {
	const s = SECOND;
	const m = MINUTE;
	const h = HOUR;
	const d = DAY;
	const w = 7 * DAY;

	const tfObj = { s, m, h, d, w };
	const [n, tf] = reduceTf(inp);

	return n * tfObj[tf];
};

export const numberToTf = (inp: number) => {
	const tfs = Object.values(Timeframes);
	const n = tfs.find(tf => tfToNumber(tf) == inp);

	if (n == null) {
		const msg = "Number is not a suppported timeframe";
		throw new Error(msg);
	}
	return n;
};

export function isCandleLengthValid(
	diff: number,
	timeframe: Timeframe
) {
	const frame = tfToNumber(timeframe);
	const count = diff / frame;
	return count < MAX_CANDLE_COUNT;
};

export function setTimeFrame(candles: Candle[], tf: Timeframe) {
	if (tf === "1d") {
		return aggregateHTFCandles(
			candles,
			23 * HOUR,
			getEtStartOfDay,
		);
	}

	if (tf === "1w") {
		return aggregateHTFCandles(
			candles,
			7 * DAY - HOUR,
			getEtStartOfWeek,
		);
	}

	const frame = tfToNumber(tf);
	if (frame < 15 * SECOND){
		throw new Error("Timeframe not supported");
	}

	const aggregated: Candle[] = [];
	let bucket = -1;

	for (const candle of candles) {
		const currBucket = Math.floor(candle.time / frame);

		if (bucket != currBucket) {
			aggregated.push({ ...candle, time: currBucket * frame });
			bucket = currBucket;
			continue;
		}

		const curr = aggregated[aggregated.length - 1];
		aggregateInto(candle, curr);
	}

	return aggregated;
};

export function fillBlanks(candles: Candle[], frame: number) {
	if (candles.length < 2) return [];

	const out: Candle[] = [candles[0]];

	for (let i = 1; i < candles.length; i++) {
		const prev = candles[i - 1];
		const curr = candles[i];

		const diff = curr.time - prev.time;
		if (diff > frame) {
			const missing = Math.floor(diff / frame) - 1;

			for (let j = 1; j <= missing; j++) {
				out.push({ time: prev.time + j * frame } as Candle);
			}
		}

		out.push(curr);
	}

	return out;
}