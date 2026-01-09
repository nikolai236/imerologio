import useApi from "./useApi";
import type { Candle, Timeframe } from '../../../shared/candles.types';

const useCandles = () => {
	const api = useApi();
	const path = '/candles';

	const isSupported = async (id: number) => {
		try {
			await api.get(path + '/supported/' + id);
			return true
		} catch (err) {
			return false;
		}
	}

	const getCandlesForRange = async (symbol: string, timeframe: Timeframe, start: number, end: number): Promise<Candle[]> => {
		try {
			const payload = { start, end, timeframe };
			const { candles } = await api.post(path +`/${symbol}`, payload);
			return candles;
		} catch (_err) {
			return [];
		}
	};

	return {
		isSupported,
		getCandlesForRange
	};
};

export default useCandles;