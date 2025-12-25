import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import type { FastifyPluginAsync } from "fastify";

declare module 'fastify' {
	interface FastifyInstance {
		prisma: PrismaClient
	}
}

const prismaPlugin: FastifyPluginAsync = async (server) => {
	const adapter = new PrismaPg({
		connectionString: process.env.DATABASE_URL,
	});

	const db = new PrismaClient({ adapter });
	await db.$connect();

	server.decorate('prisma', db);
	server.addHook('onClose', async (server) => {
		await server.prisma.$disconnect();
	});
};

export default fp(prismaPlugin);