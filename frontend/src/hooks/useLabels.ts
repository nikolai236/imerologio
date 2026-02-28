import type { ApiScoringResponse, DbLabelEntry, Label, UpdateLabel } from "../../../shared/trades.types";
import useApi from "./useApi";

const useLabels = () => {
	const api = useApi();
	const path = '/labels';

	const getLabels = async (symbols=false) => {
		let query = symbols ? { symbols } : undefined;
		const { labels } = await api.get(path, query);
		return labels as DbLabelEntry[];
	};

	const getScoring = async (filterBe: boolean, beThreshold: number) => {
		if (filterBe && isNaN(beThreshold)) {
			throw new Error("BE Threshold cannot be NaN");
		}
		const data = await api.get(path + "/scoring", {
			filterBe, beThreshold
		});
		return data as ApiScoringResponse;
	};

	const createLabel = async (payload: Label) => {
		const { label } = await api.post(path, payload);
		return label as DbLabelEntry;
	};

	const updateLabel = async (id:number, payload: UpdateLabel) => {
		const { label } = await api.patch(path + `/${id}`, payload);
		return label as DbLabelEntry;
	};

	const deleteLabel = async (id: number) => {
		await api.delete(path + `/${id}`);
	};

	return {
		getLabels,
		getScoring,
		createLabel,
		updateLabel,
		deleteLabel,
	};
};

export default useLabels;