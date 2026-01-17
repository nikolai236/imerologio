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
import newsRouter    from "./routes/news";

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
	const server = Fastify({ logger: { transport } });

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
	await server.register(newsRouter,    { prefix: '/news'    });

	server.addSchema({
		$id: "ErrorMessage",
		type: "object",
		additionalProperties: false,
		required: ["message"],
		properties: {
			message: { type: "string" },
		},
	});

	server.setErrorHandler((err: any, _req, reply) => {
		if (err.statusCode == 400 && err.validation) {
			const message = err.instancePath + ": " + err.message;
			return reply.status(400).send({ message })
		}

		console.error(err);

		const message = "Internal server error";
		return reply.status(500).send({ message });
	});

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