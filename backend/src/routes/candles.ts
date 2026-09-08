import { FastifyPluginAsync } from "fastify";
import { Candle, Timeframe } from "../../../shared/candles.types";

import candleRepositroy from "../database/candles";
import symbolRepository from "../database/symbols";

import {
	getSupportedSchema,
	postCandleSymbolSchema
} from "../schemas/candles";
import { fillBlanks, isCandleLengthValid, setTimeFrame, tfToNumber } from "../services/candles";
import { NotFoundError, ValidationError } from "../errors";

const SECOND = 1000;
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE;

const router: FastifyPluginAsync = async (server) => {
	const {
		isSymbolSupported,
		getCandles,
		getCandlesWithTf,
	} = candleRepositroy(server.duckdb);

	const { getSymbolById } = symbolRepository(server.prisma);

	interface IGet { Params: { symbolId: string }; };
	server.get<IGet>('/supported/:symbolId', getSupportedSchema, async (req, reply) => {
		const { symbolId } = req.params;

		const symbol = await getSymbolById(Number(symbolId));
		if (symbol == null) {
			throw new NotFoundError("Symbol not found");
		}

		const isSupported = await isSymbolSupported(symbol.name);
		const code = isSupported ? 200 : 405;
		const message = isSupported
			? "Symbol is supported"
			: "Symbol is not supported";

		return reply.code(code).send({ message });
	});

	interface IPost {
		Params: { symbol: string };
		Body: { start: string, end: string; timeframe: string }
	};
	server.post<IPost>('/:symbol', postCandleSymbolSchema, async (req, reply) => {
		const { timeframe } = req.body;

		const { symbol } = req.params;
		const isSuppoted = await isSymbolSupported(symbol);

		if (!isSuppoted) {
			throw new NotFoundError("Symbol not supported!");
		}

		const start = Number(req.body.start);
		const end = Number(req.body.end);

		if (start >= end) {
			throw new NotFoundError("No candles found for range.");
		}

		if (new Date(start).getFullYear() < 2010) {
			throw new ValidationError("Dates before 2010 are not supported");
		}

		if (!isCandleLengthValid(end - start, timeframe as Timeframe)) {
			throw new ValidationError("More than 25 000 candles requested");
		}

		let candles: Candle[] = [];
		if (["1w", "1d", "6h", "4h", "2h", "1h"].includes(timeframe)) {
			candles = await getCandlesWithTf(start, end, symbol, HOUR);
		} else if (["30m", "10m", "15m", "5m"].includes(timeframe)) {
			candles = await getCandlesWithTf(start, end, symbol, 5 * MINUTE);
		} else {
			candles = await getCandles(start, end, symbol);;
		}

		candles = setTimeFrame(candles, timeframe as Timeframe);

		const tf = tfToNumber(timeframe as Timeframe);
		candles = fillBlanks(candles, tf);

		if (candles.length == 0) {
			throw new NotFoundError("No candles found for range.");
		}

		return reply.code(200).send({ candles });
	});
};

export default router;