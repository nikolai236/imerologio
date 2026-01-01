import { FastifyPluginAsync } from "fastify";
import useCandleService from "../services/candles";
import useCandles from "../database/candles";
import { Timeframe } from "../../../shared/candles.types";
import useSymbols from "../database/symbols";

const router: FastifyPluginAsync = async (server) => {
	const {
		isSymbolSupported, getCandlesInRange,
	} = useCandles(server.duckdb);

	const {
		validateCandleLength, setTimeFrame,
	} = useCandleService();

	const { getSymbolById } = useSymbols(server.prisma);

	interface IGet { Params: { symbolId: string }; };
	server.get<IGet>('/supported/:symbolId', async (req, reply) => {
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
	server.post<IPost>('/:symbol', async (req, reply) => {
		const tfs = Object.keys(Timeframe);
		let { timeframe } = req.body;

		if (timeframe != undefined && !tfs.includes(timeframe)) {
			const message = "Bad timeframe input!";
			return reply.code(400).send({ message });
		}

		timeframe ??= Timeframe.tf15s;

		const { symbol } = req.params;
		const isSuppoted = await isSymbolSupported(symbol);

		if (!isSuppoted) {
			const message = 'Symbol not supported!';
			return reply.code(404).send({ message });
		}

		const start = Number(req.body.start);
		const end = Number(req.body.end);
		if (start >= end) {
			return reply.code(200).send({ candles: [] });
		}

		validateCandleLength(end - start, timeframe as Timeframe);
		
		let candles = await getCandlesInRange(start, end, symbol);
		candles = setTimeFrame(candles, timeframe as Timeframe);

		return reply.code(200).send({ candles });
	});
};

export default router;