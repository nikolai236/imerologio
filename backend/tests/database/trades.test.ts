import { $Enums } from '@prisma/client';
import db from '../helpers/prisma';
import useSymbols from '../../src/database/symbols';
import useTrades from '../../src/database/trades';
import useTradeService from '../../src/services/trades';
import { type TradeWithOrders } from '../../../shared/trades.types';

const { createSymbol, getAllSymbols, getSymbolById, deleteSymbol } = useSymbols(db);
const { createTrade, getAllTrades, getTradeById, deleteTrade, getOrderById } = useTrades(db);
const { calculatePnL } = useTradeService();

afterAll(async () => {
	await db.$disconnect();
});

afterEach(async () => {
	await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Order",
      "Trade",
      "Symbol"
    RESTART IDENTITY CASCADE;
	`);
});

describe("test symbols", () => {
	test("can create a symbol", async () => {
		const symbol = { name: "ES", type: "Futures" as $Enums.SymbolType };
		const { id } = await createSymbol(symbol);

		const s2 = await getSymbolById(id);
		const name = s2?.name;
		const type = s2?.type;

		expect({ name, type }).toEqual(symbol);
	});

	test("no two symbols with the same name", async () => {
		const symbol = { name: "ES", type: "Futures" as $Enums.SymbolType };
		await createSymbol(symbol);

		const createSecond = () => createSymbol({ ...symbol, type: 'CFD' });
		await expect(createSecond()).rejects.toThrow();
	});
});

describe("test trades", () => {
	test("can create a trade", async () => {
		const date1 =  new Date();
		const date2 = new Date(date1.getTime() + 5 * 60 * 1000);
		const date3 = new Date(date2.getTime() + 5 * 60 * 1000);
		const orders = [
			{ quantity: 2, type: 'BUY'  as $Enums.OrderType, date: date1, price: 1000 },
			{ quantity: 1, type: 'SELL' as $Enums.OrderType, date: date2, price: 1050 },
			{ quantity: 1, type: 'SELL' as $Enums.OrderType, date: date3, price: 1000 },
		];

		const trade = { stop: 990, orders };
		const makeTrade = (id: number) => createTrade({ ...trade, symbolId: id });
		await expect(makeTrade(1)).rejects.toThrow();

		const symbol = { name: "ES", type: "Futures" as $Enums.SymbolType };
		const { id } = await createSymbol(symbol);
		const res = await makeTrade(id);

		expect(res.stop).toEqual(trade.stop);

		const dates1 = orders.map(o => o.date);
		const dates2 = res.orders.map((o:any) => o.date);

		expect(dates1).toEqual(dates2);
	});
});

describe("test trades service", () => {
	test("calculate pnl", async () => {
		const date1 =  new Date();
		const date2 = new Date(date1.getTime() + 5 * 60 * 1000);
		const date3 = new Date(date2.getTime() + 5 * 60 * 1000);
		const orders = [
			{ quantity: 5, type: 'SELL' as $Enums.OrderType, date: date1, price: 1000 },
			{ quantity: 3, type: 'BUY'  as $Enums.OrderType, date: date2, price: 900 },
			{ quantity: 2, type: 'BUY'  as $Enums.OrderType, date: date3, price: 800 },
		];
		const trade = { stop: 1100, orders };

		const symbol = { name: "ES", type: "Futures" as $Enums.SymbolType };
		const { id } = await createSymbol(symbol);
		const t = await createTrade({ ...trade, symbolId:id }) as TradeWithOrders;

		expect(calculatePnL(t).pnl).toBe(700);

		const orders2 = [
			{ quantity: 5, type: 'BUY' as $Enums.OrderType, date: date1, price: 800 },
			{ quantity: 3, type: 'SELL'  as $Enums.OrderType, date: date2, price: 900 },
			{ quantity: 2, type: 'SELL'  as $Enums.OrderType, date: date3, price: 800 },
		];
		const t2 = await createTrade({  stop: 1100, orders: orders2, symbolId:id, description: '', charts: [], labels: [] }) as TradeWithOrders;

		expect(calculatePnL(t2).pnl).toBe(300);
	});
});