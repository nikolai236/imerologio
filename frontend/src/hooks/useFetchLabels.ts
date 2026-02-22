import { useEffect, useState } from "react";
import type { DbLabelEntry } from "../../../shared/trades.types";
import useLabels from "./useLabels";
import useReload from "./useReload";


const useFetchLabels = () => {
	const { getLabels } = useLabels();
	const [token, reload] = useReload();

	const [loading, setLoading] = useState(false);
	const [labels, setLabels] = useState<DbLabelEntry[]>([]);

	useEffect(() => {
		setLoading(true);
		getLabels()
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