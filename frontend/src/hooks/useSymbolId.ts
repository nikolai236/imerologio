import { useEffect, useState } from "react";
import useCandles from "./useCandles";

const useSymbolId = () => {
	const { isSupported: fetchIsSupported } = useCandles();

	const [isSupported, setIsSupported] = useState(false);
	const [symbolId, setSymbolId] = useState('');

	useEffect(() => {
		if (!symbolId) return;

		fetchIsSupported(Number(symbolId))
			.then(setIsSupported)
			.catch(console.error);

	}, [symbolId]);

	return {
		symbolId,
		isSupported,
		setSymbolId,
	}
};

export default useSymbolId;