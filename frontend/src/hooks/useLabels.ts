import type { DbLabel, Label, UpdateLabel } from "../../../shared/trades.types";
import useApi from "./useApi";

const useLabels = () => {
	const api = useApi();
	const path = '/labels';

	const getLabels = async () => {
		const { labels } = await api.get(path);
		return labels as DbLabel[];
	};

	const createLabel = async (payload: Label) => {
		const { label } = await api.post(path, payload);
		return label as DbLabel;
	};

	const updateLabel = async (id:number, payload: UpdateLabel) => {
		const { label } = await api.patch(path + `/${id}`, payload);
		return label as DbLabel;
	};

	const deleteLabel = async (id: number) => {
		await api.delete(path + `/${id}`);
	};

	return {
		getLabels,
		createLabel,
		updateLabel,
		deleteLabel,
	};
};

export default useLabels;