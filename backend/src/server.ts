import buildApp from "./app";

const PORT = 4000;

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