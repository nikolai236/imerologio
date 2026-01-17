import { FastifyPluginAsync } from "fastify";
import { Timeframe } from "../../../shared/candles.types";

import useCandles from "../database/candles";
import useSymbols from "../database/symbols";
import useCandleService from "../services/candles";

import {
	getSupportedSchema,
	postCandleSymbolSchema
} from "../schemas/candles";

const router: FastifyPluginAsync = async (server) => {
	const {
		isSymbolSupported,
		getCandlesInRange,
	} = useCandles(server.duckdb);

	const {
		isCandleLengthValid,
		setTimeFrame,
		fillBlanks,
		tfToNumber,
	} = useCandleService();

	const { getSymbolById } = useSymbols(server.prisma);

	interface IGet { Params: { symbolId: string }; };
	server.get<IGet>('/supported/:symbolId', getSupportedSchema, async (req, reply) => {
		const { symbolId } = req.params;

		const symbol = await getSymbolById(Number(symbolId));
		if (!symbol) {
			return reply.code(404).send({ message: "Symbol not found" });
		}

		const isSupported = await isSymbolSupported(symbol.name);
		const code = isSupported ? 200 : 405;
		const message = isSupported ?
			"Symbol is supported" : "Symbol is not supported";

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
			const message = 'Symbol not supported!';
			return reply.code(404).send({ message });
		}

		const start = Number(req.body.start);
		const end = Number(req.body.end);

		const notFoundMsg = 'No candles found for range.';
		if (start >= end) {
			return reply.code(404).send({ message: notFoundMsg });
		}

		if (new Date(start).getFullYear() < 2010) {
			const message = 'Dates before 2010 are not supported';
			return reply.code(404).send({ message });
		}

		if (!isCandleLengthValid(end - start, timeframe as Timeframe)) {
			const message = 'More than 25 000 candles requested';
			return reply.code(400).send({ message });
		}
		
		let candles = await getCandlesInRange(start, end, symbol);
		candles = setTimeFrame(candles, timeframe as Timeframe);

		const tf = tfToNumber(timeframe as Timeframe);
		candles = fillBlanks(candles, tf);

		if (candles.length == 0) {
			return reply.code(404).send({ message: notFoundMsg });
		}

		return reply.code(200).send({ candles });
	});
};

export default router;