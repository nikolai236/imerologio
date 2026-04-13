import type { UTCTimestamp } from "lightweight-charts";
import type { Timeframe } from "../../../shared/candles.types";

const ET_TZ = "America/New_York";

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

const getEtDateParts = (timeSec: UTCTimestamp) => {
	const parts = etFormatter.formatToParts(new Date(timeSec * 1000));

	const getNum = (type: string) =>
		Number(parts.find(p => p.type === type)!.value);

	const getStr = (type: string) =>
		parts.find(p => p.type === type)!.value;

	return {
		year: getNum("year"),
		month: getNum("month"),
		day: getNum("day"),
		weekday: getStr("weekday"),
	};
};

const getEtOffsetSeconds = (timeSec: UTCTimestamp): number => {
	const parts = etFormatter.formatToParts(new Date(timeSec * 1000));

	const getNum = (type: string) =>
		Number(parts.find(p => p.type === type)!.value);

	const asIfUtc = Date.UTC(
		getNum("year"),
		getNum("month") - 1,
		getNum("day"),
		getNum("hour"),
		getNum("minute"),
		getNum("second"),
	);

	return Math.floor((asIfUtc - timeSec * 1000) / 1000);
};

const getEtStartOfDay = (timeSec: UTCTimestamp): UTCTimestamp => {
	const { year, month, day } = getEtDateParts(timeSec);

	const naiveUtcMidnightMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
	const naiveUtcMidnightSec = Math.floor(naiveUtcMidnightMs / 1000) as UTCTimestamp;

	const offsetSec = getEtOffsetSeconds(naiveUtcMidnightSec);

	return (naiveUtcMidnightSec - offsetSec) as UTCTimestamp;
};

const getEtWeekdayIndex = (timeSec: UTCTimestamp) => {
	const { weekday } = getEtDateParts(timeSec);

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

const getEtStartOfWeek = (time: UTCTimestamp): UTCTimestamp => {
	const { year, month, day } = getEtDateParts(time);
	const weekday = getEtWeekdayIndex(time);

	const mondayUtcGuessMs = Date.UTC(year, month - 1, day - weekday, 0, 0, 0, 0);
	const mondayUtcGuessSec = Math.floor(mondayUtcGuessMs / 1000) as UTCTimestamp;

	return getEtStartOfDay(mondayUtcGuessSec);
};

const useTimeframe = () => {
	const _reduce = (timeframe: Timeframe) => {
		const num = Number(timeframe.match(/\d+/)?.[0]);
		const txt = timeframe.match(/[a-z]+/i)?.[0] as "s" | "m" | "h" | "d" | "w";
		return [num, txt] as const;
	};

	const tfToNumber = (inp: Timeframe) => {
		const s = 1;
		const m = 60 * s;
		const h = 60 * m;

		const [n, tf] = _reduce(inp);

		if (tf === "s") return n * s;
		if (tf === "m") return n * m;
		if (tf === "h") return n * h;

		throw new Error(`tfToNumber does not support timeframe: ${inp}`);
	};

	const normalizeEntry = <T extends { time: UTCTimestamp }>(
		entry: T,
		tf: Timeframe
	): T => {
		const [_, unit] = _reduce(tf);

		if (unit === "d") {
			return {
				...entry,
				time: getEtStartOfDay(entry.time),
			};
		}

		if (unit === "w") {
			return {
				...entry,
				time: getEtStartOfWeek(entry.time),
			};
		}

		const frame = tfToNumber(tf);
		const time = Math.floor(entry.time / frame) * frame as UTCTimestamp
		
		return { ...entry, time, };
	};

	const normalizeEntries = <T extends { time: UTCTimestamp }>(
		arr: T[],
		tf: Timeframe
	) => arr.map(o => normalizeEntry(o, tf));

	return {
		tfToNumber,
		normalizeEntry,
		normalizeEntries,
	} as const;
};

export default useTimeframe;