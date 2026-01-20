import type { FastifyInstance } from "fastify";
import buildApp from "../src/app";
import db from "./helpers/prisma";
import { DbSymbol, Label, LabelEntry, Order, Symbol, TradeEntry } from "../../shared/trades.types";

let app: FastifyInstance;

afterAll(async () => {
	await db.$disconnect();
});

afterEach(async () => {
	await db.$executeRawUnsafe(`
		TRUNCATE TABLE
		"Order",
		"Trade",
		"Symbol",
		"NewsEvent",
		"Chart",
		"trade_labels",
		"Label"
		RESTART IDENTITY CASCADE;
	`);
});

beforeAll(async () => {
	app = await buildApp(false);
	await app.ready();
});

afterAll(async () => {
	await app.close();
});

const orders: Order[] = [
	{
		price: 101,
		type: "BUY",
		quantity: 3,
		date: Date.now(),
	}, {
		price: 103,
		type: "SELL",
		quantity: 3,
		date: Date.now() + 5,
	}
];

it("POST symbols/", async () => {
	const s: Symbol = { name: "name", type: "Crypto", description: "" };

	let res = await app.inject({
		method: "POST", url: "/symbols", payload: s,
	});
	const { symbol, message } = await res.json();

	expect(res.statusCode).toBe(201);

	const { id, ...rest } = symbol as DbSymbol;
	expect(rest).toEqual(s);

	res = await app.inject({
		method: "POST", url: "/symbols", payload: s,
	});

	expect(res.statusCode).toBe(400);
});

it("GET symbols/ ", async () => {
	let res = await app.inject({
		method: "GET", url: "/symbols",
	});

	expect(res.statusCode).toBe(200);
	const { symbols } = await res.json();

	const s: Symbol = { name: "name", type: "Crypto", description: "" };
	res = await app.inject({
		method: "POST", url: "/symbols", payload: s,
	});

	res = await app.inject({
		method: "GET", url: "/symbols",
	});

	const { symbols: s2 } = await res.json();
	expect(symbols.length).toBe(s2.length - 1);
});

it("PATCH symbols/", async () => {
	const s: Symbol = { name: "name", type: "Crypto", description: "" };
	let res = await app.inject({
		method: "POST", url: "/symbols", payload: s,
	});

	const { symbol } = await res.json();
	res = await app.inject({
		method: "PATCH",
		url: "/symbols/" + symbol.id ,
		payload: { name: symbol.name + "1" },
	});

	expect(res.statusCode).toBe(200);

	const { symbol: s1 } = await res.json();
	expect(s1.name).toBe(s.name + "1");

	res = await app.inject({
		method: "POST", url: "/symbols", payload: s,
	});

	res = await app.inject({
		method: "PATCH",
		url: "/symbols/" + symbol.id ,
		payload: { name: s.name },
	});

	expect(res.statusCode).toBe(400);
});

it("DELETE symbols/", async () => {
	const s: Symbol = { name: "name", type: "Crypto", description: "" };
	const s1 = { ...s, name: s.name + "1" };

	let res = await app.inject({
		method: "POST", url: "/symbols", payload: s,
	});

	res = await app.inject({
		method: "POST", url: "/symbols", payload: s1,
	});

	const { symbol } = await res.json();

	res = await app.inject({
		method: "GET", url: "/symbols",
	});

	const { symbols } = await res.json();
	expect(symbols.length).toBe(2);

	res = await app.inject({
		method: "DELETE",
		url: "/symbols/" + symbol.id,
	});	

	expect(res.statusCode).toBe(200);

	res = await app.inject({
		method: "GET", url: "/symbols",
	});

	const { symbols: ss } = await res.json();
	expect(ss.length).toBe(1);
});

it("POST trades/", async () => {
	const s: Symbol = { name: "name", type: "Crypto", description: "" };

	let res = await app.inject({
		method: "POST", url: "/symbols", payload: s,
	});
	const { symbol } = await res.json();

	const t: TradeEntry = {
		stop: 100,
		description: "",
		symbolId: symbol.id,
	};

	res = await app.inject({
		method: "POST", url: "/trades", payload: t,
	});
	expect(res.statusCode).toBe(400);

	res = await app.inject({
		method: "POST",
		url: "/trades",
		payload: {
			...t,
			orders,
			charts: [],
			labels: [],
		},
	});

	const { trade, message } = await res.json();

	expect(res.statusCode).toBe(201);

	const { stop, description, symbolId } = trade;
	expect({ stop, description, symbolId }).toEqual(t);

});

it("GET trades/", async () => {
	const s: Symbol = { name: "name", type: "Crypto", description: "" };

	let res = await app.inject({
		method: "POST", url: "/symbols", payload: s,
	});
	const { symbol } = await res.json();

	const t: TradeEntry = {
		stop: 100,
		description: "",
		symbolId: symbol.id,
	};

	res = await app.inject({
		method: "POST",
		url: "/trades",
		payload: {
			...t,
			orders,
			charts: [],
			labels: [],
		},
	});

	res = await app.inject({
		method: "POST",
		url: "/trades",
		payload: {
			...t,
			orders,
			charts: [],
			labels: [],
		},
	});

	res = await app.inject({
		method: "GET",
		url: "/trades",
	});

	let { trades } = await res.json();

	expect(res.statusCode).toBe(200);
	expect(trades.length).toBe(2);
});

it("POST labels/ ", async () => {
	const l: LabelEntry = { name: "label" };

	let res = await app.inject({
		method: "POST",
		url: "/labels",
		payload: l,
	});

	let { label, message } = await res.json();

	expect(res.statusCode).toBe(201);
	expect(label.name).toBe(l.name);

	res = await app.inject({
		method: "POST",
		url: "/labels",
		payload: l,
	});

	expect(res.statusCode).toBe(400);
});

it("Trades - Labels relation", async () => {
	const s: Symbol = { name: "name", type: "Crypto", description: "" };

	let res = await app.inject({
		method: "POST", url: "/symbols", payload: s,
	});
	const { symbol } = await res.json();

	const t: TradeEntry = {
		stop: 100,
		description: "",
		symbolId: symbol.id,
	};

	const l: LabelEntry = { name: "label" };

	res = await app.inject({
		method: "POST",
		url: "/labels",
		payload: l,
	});

	let { label } = await res.json();

	res = await app.inject({
		method: "POST",
		url: "/trades",
		payload: {
			...t,
			orders,
			charts: [],
			labels: [{ id: label.id }],
		},
	});

	let { trade, message } = await res.json();

	expect(res.statusCode).toBe(201);
	expect(trade.labels[0]).toEqual(label);

	res = await app.inject({
		method: "POST",
		url: "/labels",
		payload: {
			name: l.name + "1",
			tradeIds: [trade.id]
		},
	});

	expect(res.statusCode).toBe(201);

	res = await app.inject({
		method: "GET", url: "/trades/" + trade.id,
	});

	({ trade, message } = await res.json());
	expect(res.statusCode).toBe(200);

	expect(trade.labels.map(({ name }: any) => name)).toContain(l.name);
	expect(trade.labels.map(({ name }: any) => name)).toContain(l.name + "1")
});