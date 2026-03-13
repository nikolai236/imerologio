import { useEffect, useState } from "react";
import { isSupported as fetchIsSupported } from "../api/candles";

const useSymbolId = () => {
	const [isSupported, setIsSupported] = useState(false);
	const [symbolId, setSymbolId] = useState("");

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
	} as const;
};

export default useSymbolId;