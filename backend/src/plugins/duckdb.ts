import fp from "fastify-plugin";
import duckdb from 'duckdb';
import { FastifyPluginAsync } from "fastify";

declare module 'fastify' {
	interface FastifyInstance {
		duckdb: {
			query<T>(sql: string, params?: unknown[]): Promise<T[]>;
			exec(sql: string): Promise<void>;
		};
	}
}

const duckdbPlugin: FastifyPluginAsync = async (server) => {
	const db = new duckdb.Database(process.env.DUCKDB_PATH!);
	const connection = db.connect();

	const query = <T=any>(sql: string, params: unknown[]=[]) => new Promise<T[]>(
		(resolve, reject) => connection.all(
			sql, params, (err, rows) => err ? reject(err) : resolve(rows as T[])
		)
	);

	const exec = (sql: string) => new Promise<void>(
		(resolve, reject) => {
			connection.run(sql, (err) => err ? reject(err) : resolve())
		}
	);

	server.decorate('duckdb', { query, exec });
	server.addHook('onClose', async () => {
		connection.close();
		db.close();
	});
};

export default fp(duckdbPlugin);