import type { Candle, Timeframe } from "../../../shared/candles.types";
import api from "./api";

const path = "/candles";

export async function isSupported(id: number) {
	try {
		await api.get(path + "/supported/" + id);
		return true
	} catch (err) {
		return false;
	}
}

export async function getCandlesForRange(
	symbol: string,
	timeframe: Timeframe,
	start: number,
	end: number,
): Promise<Candle[]> {
	const payload = { start, end, timeframe };

	const { candles } = await api.post(
		path +`/${symbol}`, payload
	);
	return candles;
};
