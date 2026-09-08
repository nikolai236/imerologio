import { useMemo, useState } from "react";
import useFetchLabels from "./useFetchLabels";
import type { DbLabelWithDescendats } from "../../../shared/trades.types";
import { getAdjacencyList, getLabelWithDescendants } from "../api/labels";

const useLabels = () => {
	const { labels, reloadLabels } = useFetchLabels();

	const [editChildrenId, setEditChildrenId] = useState<number | null>(null);
	const closeEditChildren = () => setEditChildrenId(null);

	const [list, setList] = useState<Record<number, number[]>>({});
	const [rootLabel, setRootLabel] = useState<DbLabelWithDescendats | null>(null);

	const labelMap = useMemo(
		() => new Map(labels.map(({ id, name }) => [id, name])),
		[labels]
	);

	const loadGraphData = async (id: number) => {
		const [currentLabel, currentAdjList] = await Promise.all([
			getLabelWithDescendants(id),
			getAdjacencyList(id),
		]);

		setRootLabel(currentLabel);
		setList(currentAdjList);
	};

	const clearGraphData = () => {
		setRootLabel(null);
		setList({});
	};

	return {
		labels,
		labelMap,
		reloadLabels,

		list,
		rootLabel,

		loadGraphData,
		clearGraphData,

		editChildrenId,
		setEditChildrenId,
		closeEditChildren,
	} as const;
};

export default useLabels;