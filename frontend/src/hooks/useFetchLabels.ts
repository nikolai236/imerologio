import { useEffect, useState } from "react";
import type { LabelWithId } from "../../../shared/trades.types";
import useLabels from "./useLabels";
import useReload from "./useReload";


const useFetchLabels = () => {
	const { getLabels } = useLabels();
	const [reloadToken, reload] = useReload();

	const [loading, setLoading] = useState(false);
	const [labels, setLabels] = useState<LabelWithId[]>([]);

	useEffect(() => {
		setLoading(true);
		getLabels()
			.then(setLabels)
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [reloadToken]);

	return {
		labels,
		loadingLabels: loading,
		reload,
	};
}

export default useFetchLabels;