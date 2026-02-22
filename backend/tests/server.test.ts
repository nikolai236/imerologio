import type { FastifyInstance } from "fastify";
import buildApp from "../src/app";
import db from "./helpers/prisma";
import { DbSymbol, LabelEntry, Order, Symbol, TradeEntry } from "../../shared/trades.types";
import { Timeframes } from "../../shared/candles.types";

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

const orders2: Order[] = [
	{
		price: 101,
		type: "SELL",
		quantity: 3,
		date: Date.now(),
	}, {
		price: 103,
		type: "BUY",
		quantity: 2,
		date: Date.now() + 5,
	}, {
		price: 106,
		type: "BUY",
		quantity: 1,
		date: Date.now() + 8,
	}
];

const createSymbol = async (payload?: Partial<Symbol>) => {
	const s: Symbol = {
		name: payload?.name ?? "name",
		type: payload?.type ?? "Crypto",
		description: payload?.description ?? "",
	};

	const res = await app.inject({
		method: "POST",
		url: "/symbols",
		payload: s,
	});

	expect(res.statusCode).toBe(201);
	const { symbol } = await res.json();
	return symbol as DbSymbol;
};

const createLabel = async (name = "L1") => {
	const res = await app.inject({
		method: "POST",
		url: "/labels",
		payload: { name },
	});

	expect(res.statusCode).toBe(201);
	const { label } = await res.json();
	return label as { id: number; name: string };
};

const createTrade = async (args: {
	symbolId: number;
	labelIds?: number[];
	stop?: number;
	target?: number;
	pnl?: number;
	description?: string;
	orders?: Order[];
}) => {
	const labelIds = args.labelIds ?? [];
	const payload = {
		symbolId: args.symbolId,
		target: args.target ?? undefined,
		stop: args.stop ?? 100,
		pnl: args.pnl ?? undefined,
		description: args.description ?? "",
		labels: labelIds.map((id) => ({ id })),
		orders: args.orders ?? orders,
		charts: [
			{
				timeframe: Timeframes.tf30s,
				start: Date.now() - 1000,
				end: Date.now(),
			}
		],
	};

	const res = await app.inject({
		method: "POST",
		url: "/trades",
		payload,
	});

	expect(res.statusCode).toBe(201);
	const { trade } = await res.json();
	return trade as any;
};

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
	expect(trade.labels.map(({ name }: any) => name)).toContain(l.name + "1");
});

it("PATCH trades/ ", async () => {
	const s: Symbol = { name: "name", type: "Crypto", description: "" };
	const s2: Symbol = { name: "name1", type: "Crypto", description: "" };

	let res = await app.inject({
		method: "POST", url: "/symbols", payload: s,
	});
	let { symbol } = await res.json();

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
	let { trade } = await res.json();

	res = await app.inject({
		method: "POST", url: "/symbols", payload: s2,
	});
	({ symbol } = await res.json());

	const l: LabelEntry = { name: "label" };

	res = await app.inject({
		method: "POST",
		url: "/labels",
		payload: l,
	});

	let { label } = await res.json();

	res = await app.inject({
		method: "PATCH",
		url: "/trades/" + trade.id,
		payload: {
			symbolId: symbol.id,
			labels: [{ id: label.id }],
		},
	});

	({ trade } = await res.json());

	expect(res.statusCode).toBe(200);
	expect(trade.labels[0]).toEqual(label);
	expect(trade.symbol).toEqual(symbol);

	res = await app.inject({
		method: "PATCH",
		url: "/trades/" + trade.id,
		payload: {
			orders: [],
		},
	});

	expect(res.statusCode).toBe(400);

	const newOrders = orders.map(o => ({ ...o }));
	newOrders[1].quantity = 5;

	res = await app.inject({
		method: "PATCH",
		url: "/trades/" + trade.id,
		payload: {
			orders: newOrders,
		},
	});

	expect(res.statusCode).toBe(400);

	res = await app.inject({
		method: "PATCH",
		url: "/trades/" + trade.id,
		payload: {
			orders: orders2,
		},
	});

	expect(res.statusCode).toBe(200);
});

it("GET labels/scoring returns expected shape", async () => {
	const symbol = await createSymbol({ name: "ETHUSD" });

	const lA = await createLabel("A");
	const lB = await createLabel("B");

	// Two trades, different PnL profiles, with different label combos
	await createTrade({
		symbolId: symbol.id,
		labelIds: [lA.id],
		stop: 100,
		target: 110,
		orders: [
			{ price: 100, type: "BUY", quantity: 1, date: Date.now() },
			{ price: 110, type: "SELL", quantity: 1, date: Date.now() + 1 },
		],
	});

	await createTrade({
		symbolId: symbol.id,
		labelIds: [lA.id, lB.id],
		stop: 100,
		target: 95,
		orders: [
			{ price: 100, type: "BUY", quantity: 1, date: Date.now() + 10 },
			{ price: 95, type: "SELL", quantity: 1, date: Date.now() + 11 },
		],
	});

	const res = await app.inject({
		method: "GET",
		url: "/labels/scoring",
	});

	expect(res.statusCode).toBe(200);

	const body = await res.json();

	// minimal shape assertions (keeps test stable while you iterate on scoring)
	expect(body).toEqual(expect.objectContaining({
		means: expect.objectContaining({
			muAll: expect.any(Number),
			avgAbsPnl: expect.any(Number),
		}),
		minSupport: expect.any(Number),
		tradeCount: expect.any(Number),
		levels: expect.any(Array),
	}));

	// optional: make sure at least L1 (singletons) level exists
	if (body.levels.length > 0) {
		expect(body.levels[0]).toEqual(expect.objectContaining({
			minSupport: expect.any(Number),
			scoreSets: expect.any(Array),
		}));
	}
});

it("GET labels/scoring supports multiple levels (k=1..3) and stays stable with big numbers", async () => {
	const symbol = await createSymbol({ name: "BIGUSD" });

	// Create 4 labels; we'll force a strong 3-itemset (A,B,C) to exist with high support.
	const A = await createLabel("A");
	const B = await createLabel("B");
	const C = await createLabel("C");
	const D = await createLabel("D");

	// Big-number PnL generator:
	// pnl = qty * (sell - buy)
	// Choose qty=1000, buy=1e9, sell=1e9+5e8 => pnl = 5e11
	const mkOrders = (pnlSign: 1 | -1): Order[] => {
		const qty = 1000;
		const buy = 1_000_000_000;
		const delta = 500_000_000 * pnlSign; // +/- 5e8
		const sell = buy + delta;

		const t0 = Date.now();
		return [
			{ price: buy,  type: "BUY",  quantity: qty, date: t0 },
			{ price: sell, type: "SELL", quantity: qty, date: t0 + 1 },
		];
	};

	// Build dataset:
	// - 40 trades: labels A,B,C with +5e11 pnl (strong positive uplift)
	// - 25 trades: labels A,B with -5e11 pnl (pull AB down vs ABC)
	// - 15 trades: labels A only with -5e11 pnl
	// - 20 trades: labels D only with +5e11 pnl (noise / another strong singleton)
	//
	// This guarantees:
	// support(A,B,C) = 40  (=> appears in k=3)
	// support(A,B) >= 65   (40 + 25)
	// support(A) >= 80     (40 + 25 + 15)
	const createMany = async (n: number, labelIds: number[], pnlSign: 1 | -1) => {
		for (let i = 0; i < n; i++) {
			await createTrade({
				symbolId: symbol.id,
				labelIds,
				stop: 1, // arbitrary, doesn't matter for pnl calc
				orders: mkOrders(pnlSign),
			});
		}
	};

	await createMany(40, [A.id, B.id, C.id],  1);
	await createMany(25, [A.id, B.id],      -1);
	await createMany(15, [A.id],            -1);
	await createMany(20, [D.id],             1);

	const res = await app.inject({
		method: "GET",
		url: "/labels/scoring",
	});
	expect(res.statusCode).toBe(200);

	const body = await res.json();

	// Basic shape + sanity (no NaN/Infinity with big numbers)
	expect(body).toEqual(expect.objectContaining({
		means: expect.objectContaining({
			muAll: expect.any(Number),
			avgAbsPnl: expect.any(Number),
		}),
		minSupport: expect.any(Number),
		tradeCount: expect.any(Number),
		levels: expect.any(Array),
	}));

	expect(Number.isFinite(body.means.muAll)).toBe(true);
	expect(Number.isFinite(body.means.avgAbsPnl)).toBe(true);
	expect(body.tradeCount).toBe(40 + 25 + 15 + 20);

	// Ensure we actually produced multiple levels (k=1,2,3)
	// levels[0] -> singletons, levels[1] -> pairs, levels[2] -> triples (if present)
	// console.log(JSON.stringify(body.levels, null, 2))
	expect(body.levels.length).toBeGreaterThanOrEqual(3);

	// Helper to find a set by labelIds (order-insensitive)
	const findSet = (levelIdx: number, ids: number[]) => {
		const want = [...ids].sort((a, b) => a - b).join(",");
		const level = body.levels[levelIdx];
		for (const s of level.scoreSets) {
			const got = [...s.labelIds].sort((a: number, b: number) => a - b).join(",");
			if (got === want) return s;
		}
		return null;
	};

	// k=3: (A,B,C) exists with support 40 and muIn ~= +5e11
	const abc = findSet(2, [A.id, B.id, C.id]);
	expect(abc).not.toBeNull();
	expect(abc.support).toBe(40);
	expect(Number.isFinite(abc.muIn)).toBe(true);
	expect(abc.muIn).toBeCloseTo(500_000_000_000, -2); // very large, allow some tolerance
	expect(abc.upliftPnl).toBeGreaterThan(0);

	// k=2: (A,B) exists with support 65
	const ab = findSet(1, [A.id, B.id]);
	expect(ab).not.toBeNull();
	expect(ab.support).toBe(65);

	// Its mean should be somewhere between +5e11 (40x) and -5e11 (25x):
	// mu = (40*+5e11 + 25*-5e11) / 65 = (15*5e11)/65 ≈ 1.1538461538e11
	expect(Number.isFinite(ab.muIn)).toBe(true);
	expect(ab.muIn).toBeCloseTo(115_384_615_384.61539, -2);

	// k=1: A exists with support 80
	const a = findSet(0, [A.id]);
	expect(a).not.toBeNull();
	expect(a.support).toBe(80);

	// avgAbsPnl should be near 5e11 because all trades are +/- 5e11
	expect(body.means.avgAbsPnl).toBeCloseTo(500_000_000_000, -2);

	// All scores should be finite numbers (big-number safety)
	for (const lvl of body.levels) {
		for (const s of lvl.scoreSets) {
			expect(Number.isFinite(s.score)).toBe(true);
			if (s.muIn != null) expect(Number.isFinite(s.muIn)).toBe(true);
			if (s.upliftPnl != null) expect(Number.isFinite(s.upliftPnl)).toBe(true);
		}
	}
});
