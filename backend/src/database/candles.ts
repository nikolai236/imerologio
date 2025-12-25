import type { Candle } from '../../../shared/candles.types';
import { FastifyInstance } from "fastify";

const useCandles = (db: FastifyInstance["duckdb"]) => {

	const getTableName = (symbol: string) =>
		'candles_' + symbol.toUpperCase();

	const isSymbolSupported = async (symbol: string) => {
		const query = `
			SELECT 1 AS exists FROM information_schema
			WHERE table_schema = 'main AND table_name = ?`;

		const rows = await db.query<{ exists: number }>(
			query, [getTableName(symbol)]
		);
		return rows.length > 0;
	};

	const getRange = async (symbol: string) => {
		const query =
			`SELECT MIN(time) AS "minTime", MAX(time) AS "maxTime"
			FROM ?`;

		const rows = await db.query<{ minTime: string; maxTime: string }>(
			query, [getTableName(symbol)]
		);
		return rows.length > 0 ?
			[Number(rows[0].minTime), Number(rows[0].maxTime)] : [];
	};

	const getCandlesInRange = async (start: number, end: number, symbol: string) => {
		const query = `
			SELECT * FROM ?
			WHERE time >= ? AND time < ?
			ORDER BY time`;

		const table = getTableName(symbol);
		const rows = await db.query<Candle>(
			query, [table, start, end]
		);
		return rows;
	};

	return {
		isSymbolSupported,
		getRange,
		getCandlesInRange,
	};
};

export default useCandles;