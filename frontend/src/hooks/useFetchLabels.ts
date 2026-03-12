import { useEffect, useState } from "react";
import type { DbLabelEntry } from "../../../shared/trades.types";
import useReload from "./useReload";

import { getLabels } from "../api/labels";

const useFetchLabels = (symbols=false) => {
	const [token, reload] = useReload();

	const [loading, setLoading] = useState(false);
	const [labels, setLabels] = useState<DbLabelEntry[]>([]);

	useEffect(() => {
		setLoading(true);
		getLabels(symbols)
			.then(setLabels)
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [token]);

	return {
		labels,
		loadingLabels: loading,
		reload,
	};
}

export default useFetchLabels;