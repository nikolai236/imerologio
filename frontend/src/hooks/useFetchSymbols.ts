import { useEffect, useState } from "react"
import type { SymbolWithId } from "../../../shared/trades.types"
import useSymbols from "./useSymbols";

const useFetchSymbols = () => {
	const { getSymbols } = useSymbols();
	const [loading, setLoading] = useState(false);
	const [symbols, setSymbols] = useState<SymbolWithId[]>([]);

	useEffect(() => {
		setLoading(true);
		getSymbols()
			.then(setSymbols)
			.catch(console.error)
			.then(() => setLoading(false));
	}, []);

	return {
		symbols,
		loadingSymbols: loading,
	};
}

export default useFetchSymbols;