import type { Candle } from '../../../shared/candles.types';
import { FastifyInstance } from "fastify";

const useCandles = (db: FastifyInstance["duckdb"]) => {
	const dbFrame = 15_000;

	const _parseBigInt = <T extends Record<string, any>>(obj: T): T =>
		(Object.keys(obj) as (keyof T)[]).reduce((ret, k) => {
			if (typeof ret[k] != 'bigint') return ret;
			else return { ...ret, [k]:  Number(ret[k]) as any, };
		}, obj);

	const getTableName = (symbol: string) => {
		if (!/^[A-Za-z0-9_]+$/.test(symbol)) {
			throw new Error("Invalid table name");
		}
		return 'candles_' + symbol;
	};

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

		rows = rows.map(_parseBigInt);
		return rows.length > 0 ?
			[Number(rows[0].minTime), Number(rows[0].maxTime)] :
			[];
	};

	const getCandlesInRange = async (start: number, end: number, symbol: string) => {
		const bucket = Math.floor(start / dbFrame);
		start = bucket * dbFrame;

		const table = getTableName(symbol);
		const query = `
			SELECT *
			FROM ${table}
			WHERE time >= ? AND time < ?
			ORDER BY time ASC`;

		const rows = await db.query<Candle>(query, [start, end]);
		return rows.map(_parseBigInt);
	};

	return {
		dbFrame,
		isSymbolSupported,
		getRange,
		getCandlesInRange,
	};
};

export default useCandles;