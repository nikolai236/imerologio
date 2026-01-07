import { useEffect, useState } from "react";
import type { LabelWithId } from "../../../shared/trades.types";
import useLabels from "./useLabels";


const useFetchLabels = () => {
	const { getLabels } = useLabels();
	const [loading, setLoading] = useState(false);
	const [labels, setLabels] = useState<LabelWithId[]>([]);

	useEffect(() => {
		setLoading(true);
		getLabels()
			.then(setLabels)
			.catch(console.error)
			.then(() => setLoading(false));
	}, []);

	return {
		labels,
		loadingLabels: loading,
	};
}

export default useFetchLabels;