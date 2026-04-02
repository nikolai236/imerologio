import type {
	ApiScoringResponse,
	DbLabelEntry,
	Label,
	PerformanceReport,
	UpdateLabel
} from "../../../shared/trades.types";

import api from "./api";

const path = "/labels";

export async function getLabels(symbols=false) {
	const query = symbols ? { symbols } : undefined;

	const { labels } = await api.get(path, query);
	return labels as DbLabelEntry[];
};

export async function getPerformance(
	includeIds: number[], excludeIds: number[]
) {
	const report = await api.get(`${path}/performance`, {
		includeIds: includeIds.join(","),
		excludeIds: excludeIds.join(","),
	});
	return report as PerformanceReport;
}

export async function getScoring(filterBe: boolean, beThreshold: number) {
	if (filterBe && isNaN(beThreshold)) {
		throw new Error("BE Threshold cannot be NaN");
	}

	const data = await api.get(path + "/scoring", {
		filterBe, beThreshold
	});

	return data as ApiScoringResponse;
};

export async function createLabel(payload: Label) {
	const { label } = await api.post(path, payload);

	return label as DbLabelEntry;
};

export async function updateLabel(id:number, payload: UpdateLabel) {
	const { label } = await api.patch(
		path + `/${id}`, payload
	);

	return label as DbLabelEntry;
};

export async function deleteLabel(id: number) {
	await api.delete(path + `/${id}`);
};