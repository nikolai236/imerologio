import Fastify from "fastify";
import compress from "@fastify/compress";
import cors from "@fastify/cors";

import prismaPlugin from "./plugins/prisma";
import uploadsPlugin from "./plugins/upload";
import duckdbPlugin from "./plugins/duckdb";

import candlesRouter from "./routes/candles";
import tradesRouter  from "./routes/trades";
import symbolsRouter from "./routes/symbols";
import labelsRouter  from './routes/labels';

import "dotenv/config";

const PORT = 4000;

const buildApp = async () => {
	const transport = {
		target: 'pino-pretty',
		options: { 
			ignore: 'pid,hostname',
			messageFormat: '{req.method} {req.url} -> {res.statusCode}',
			translateTime: 'HH:MM:ss',
			colorize: true,
		}
	};
	const server = Fastify({logger: { transport } });

	await server.register(cors, {
		origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	});

	await server.register(compress, {
		global: true,
		encodings: ['gzip', 'deflate', 'br'],
	});
	await server.register(prismaPlugin);
	await server.register(duckdbPlugin);
	await server.register(uploadsPlugin);

	// server.addHook("onRequest", async (req) => {
	// 	console.log("RAW BODY:", req.body);
	// 	console.log("HEADERS:", req.headers["content-type"]);
	// });

	await server.register(tradesRouter,  { prefix: '/trades'  });
	await server.register(symbolsRouter, { prefix: '/symbols' });
	await server.register(labelsRouter,  { prefix: '/labels'  });
	await server.register(candlesRouter, { prefix: '/candles' });

	server.get('/ping', async () => ({ message: 'pong', }));

	return server;
};

const startServer = async () => {
	const app = await buildApp();

	try {
		await app.listen({ port: PORT, host: '127.0.0.1', });
		console.log('Server running on ' + PORT);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

startServer();