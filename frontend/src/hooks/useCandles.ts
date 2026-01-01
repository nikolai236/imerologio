import useApi from "./useApi";
import type { Candle } from '../../../shared/candles.types';

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

	const getCandlesForRange = async (symbol: string, start: number, end: number): Promise<Candle[]> => {
		try {
			const { candles } = await api.post(path +`/${symbol}`, { start, end });
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