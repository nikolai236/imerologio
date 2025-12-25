import type { LabelWithId, LabelWithTradeIds, UpdateLabel } from "../../../shared/trades.types";
import useApi from "./useApi";

const useLabels = () => {
	const api = useApi();
	const path = '/labels';

	const getLabels = async () => {
		const { labels } = await api.get(path);
		return labels as LabelWithId[];
	};

	const createLabel = async (payload: LabelWithTradeIds) => {
		const { label } = await api.post(path, payload);
		return label as LabelWithId;
	};

	const updateLabel = async (id:number, payload: UpdateLabel) => {
		const { label } = await api.patch(path + `/${id}`, payload);
		return label;
	};

	const deleteLabel = async (id: number) => {
		await api.delete(path + `/${id}`);
	};

	return {
		getLabels, createLabel, updateLabel, deleteLabel
	};
};

export default useLabels;