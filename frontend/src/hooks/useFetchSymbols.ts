import { useEffect, useState } from "react"
import type { DbSymbol } from "../../../shared/trades.types"
import useReload from "./useReload";

import { getSymbols } from "../api/symbols";

const useFetchSymbols = () => {
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
		reloadSymbols: reload,
	};
}

export default useFetchSymbols;