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

const buildApp = async (logger=true) => {
	const transport = {
		target: 'pino-pretty',
		options: { 
			ignore: 'pid,hostname',
			messageFormat: '{req.method} {req.url} -> {res.statusCode}',
			translateTime: 'HH:MM:ss',
			colorize: true,
		}
	};
	const app = Fastify({
        logger: logger && { transport },
    });

	await app.register(cors, {
		origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	});

	await app.register(compress, {
		global: true,
		encodings: ['gzip', 'deflate', 'br'],
	});
	await app.register(prismaPlugin);
	await app.register(duckdbPlugin);
	await app.register(uploadsPlugin);

	// app.addHook("onRequest", async (req) => {
	// 	console.log("RAW BODY:", req.id, req.body);
	// 	console.log("HEADERS:", req.headers["content-type"]);
	// });

	await app.register(tradesRouter,  { prefix: '/trades'  });
	await app.register(symbolsRouter, { prefix: '/symbols' });
	await app.register(labelsRouter,  { prefix: '/labels'  });
	await app.register(candlesRouter, { prefix: '/candles' });
	await app.register(newsRouter,    { prefix: '/news'    });

	app.addSchema({
		$id: "ErrorMessage",
		type: "object",
		additionalProperties: false,
		required: ["message"],
		properties: {
			message: { type: "string" },
		},
	});

	app.setErrorHandler((err: any, _req, reply) => {
		if (err.statusCode == 400 && err.validation) {
			const message = err.instancePath + ": " + err.message;
			return reply.status(400).send({ message })
		}

		app.log.error(err);

		const message = "Internal server error";
		return reply.status(500).send({ message });
	});

	app.get('/ping', async () => ({ message: 'pong', }));

	return app;
};

export default buildApp;