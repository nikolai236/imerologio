import { useEffect, useState } from "react"
import type { DbSymbol } from "../../../shared/trades.types"
import useSymbols from "./useSymbols";
import useReload from "./useReload";

const useFetchSymbols = () => {
	const { getSymbols } = useSymbols();
	const [reloadToken, reload] = useReload();

	const [loading, setLoading] = useState(false);
	const [symbols, setSymbols] = useState<DbSymbol[]>([]);

	useEffect(() => {
		setLoading(true);
		getSymbols()
			.then(setSymbols)
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [reloadToken]);

	return {
		symbols,
		loadingSymbols: loading,
		reload,
	};
}

export default useFetchSymbols;