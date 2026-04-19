import type { Candle } from '../../../shared/candles.types';
import { FastifyInstance } from "fastify";

const SECOND = 1000;
const DB_FRAME = 15 * SECOND;

const getTableName = (symbol: string) => {
	if (!/^[A-Za-z0-9_]+$/.test(symbol)) {
		throw new Error("Invalid table name");
	}

	return "candles_" + symbol;
};

const parseBigInt = <T extends Record<string, any>>(obj: T): T =>
	(Object.keys(obj) as (keyof T)[])
		.reduce((ret, k) =>
			typeof ret[k] !== "bigint"
				? ret
				: {
					...ret,
					[k]:  Number(ret[k]) as any
				},
			obj);

export default function candleRepositroy(db: FastifyInstance["duckdb"]) {
	const isSymbolSupported = async (symbol: string) => {
		const query = `
			SELECT 1 AS exists FROM information_schema.tables
			WHERE table_name = ?`;

		const rows = await db.query<{ exists: number }>(
			query, [getTableName(symbol)]
		);

		return rows.length > 0;
	};

	const getRange = async (symbol: string): Promise<([number, number]|[])> => {
		const table = getTableName(symbol);
		const query = `
			SELECT MIN(time) AS "minTime", MAX(time) AS "maxTime"
			FROM ${table}`;

		let rows = await db.query<{ minTime: string; maxTime: string }>(
			query
		);

		rows = rows.map(parseBigInt);
		return rows.length > 0
			? [Number(rows[0].minTime), Number(rows[0].maxTime)]
			: [];
	};

	const getCandles = async (
		start: number,
		end: number,
		symbol: string
	) => {
		const bucket = Math.floor(start / DB_FRAME);
		start = bucket * DB_FRAME;

		const table = getTableName(symbol);
		const query = `
			SELECT *
			FROM ${table}
			WHERE time >= ? AND time < ?
			ORDER BY time ASC`;

		const rows = await db.query<Candle>(query, [start, end]);
		return rows.map(parseBigInt);
	};

	const getCandlesWithTf = async (
		start: number,
		end: number,
		symbol: string,
		timeframe: number
	) => {
		const bucket = Math.floor(start / DB_FRAME);
		start = bucket * DB_FRAME;

		const table = getTableName(symbol);
		const sql = `
			WITH buckets AS (
				SELECT
					(time // ?) * ? AS bucket_time,
					time,
					open,
					high,
					low,
					close,
					volume
				FROM ${table}
				WHERE time >= ? AND time < ?
			)
			SELECT
				bucket_time AS time,
				first(open ORDER BY time ASC)   AS open,
				max(high)                       AS high,
				min(low)                        AS low,
				last(close ORDER BY time ASC)   AS close,
				sum(volume)                     AS volume
			FROM buckets
			GROUP BY bucket_time
			ORDER BY bucket_time`;

		const rows = await db.query<Candle>(sql, [
			timeframe, timeframe, start, end
		]);
		return rows.map(parseBigInt);
	};

	return {
		dbFrame: DB_FRAME,
		isSymbolSupported,
		getRange,
		getCandles,
		getCandlesWithTf,
	} as const;
}
