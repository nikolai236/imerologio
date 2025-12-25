import fp from "fastify-plugin"
import multipart from "@fastify/multipart"
import fastifyStatic from "@fastify/static";

import { mkdir } from "fs/promises";
import { createWriteStream } from "fs";
import { type FastifyPluginAsync } from "fastify";
import { randomUUID } from "crypto";
import { join } from "path";

function safeExtFromMime(mime?: string) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

const uploadsPlugin: FastifyPluginAsync = async (server) => {
	await server.register(multipart, {
		limits: {
			fileSize: 8 * 1024 * 1024,
			files: 5,
		}
	});

	const root = process.env.UPLOAD_DIR!;
	await mkdir(root, { recursive: true });

	await server.register(fastifyStatic, {
		root, prefix: '/uploads/'
	});

	server.post('/uploads/image', async (req, reply) => {
		const file = await req.file();
		if (!file) return reply.code(400).send({ message: "Missing file" });

		const ext = safeExtFromMime(file.mimetype);
		const name = `${randomUUID()}.${ext}`;
		const out = join(root, name);

		await new Promise((resolve, reject) => {
			const ws = createWriteStream(out);
			file.file.pipe(ws);

			ws.on('finish', resolve);
			ws.on('error',  reject);
		});

		return reply.send({ url: `/uploads/${name}` });
	});
};

export default fp(uploadsPlugin);