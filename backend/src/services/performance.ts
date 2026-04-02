import type { PrismaClient } from "@prisma/client";

import type { DbChart, PerformanceReport } from "../../../shared/trades.types";

import { calculatePnL } from "./trades";
import { numberToTf } from "./candles";
import tradeRepository from "../database/trades";

const labelsPerformanceService = (db: PrismaClient) => {
	const { getTradesForLabels } = tradeRepository(db);

	const getPerformance = async (
		includeIds: number[],
		excludeIds: number[],
	) => {
		const trades = await getTradesForLabels(includeIds, excludeIds);

		let totalWin = 0;
		let totalLoss = 0;

		let wins = 0;

		for (const trade of trades) {
			if (trade.pnl == null) {
				trade.pnl = calculatePnL(trade.orders);
			}

			if (trade.pnl < 0) {
				totalLoss += Math.abs(trade.pnl);
				continue;
			}

			wins++;
			totalWin += trade.pnl;
		}

		const profitFactor = totalLoss !== 0
			? totalWin / totalLoss
			: null;

		const winRate = wins / trades.length;

		const sanitizedTrades = trades.map(trade => ({
			...trade,
			charts: trade.charts.map(chart => ({
				...chart,
				start: Number(chart.start),
				end: Number(chart.end),
				timeframe: numberToTf(chart.timeframe),
			})),
		}));

		return {
			profitFactor,
			winRate,
			trades: sanitizedTrades,
		} as PerformanceReport;
	};

	return getPerformance;
};

export default labelsPerformanceService;