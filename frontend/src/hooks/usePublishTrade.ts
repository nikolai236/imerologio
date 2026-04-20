import { useCallback, useMemo, useState } from "react";
import useJournalContext from "./useJournalContext";
import { publishJournalTrade, unpublishJournalTrade } from "../api/journal";


const usePublishTrade = (id: string) => {
	const { getTrade, updateTrade } = useJournalContext();
	const [loading, setLoading] = useState(false);

	const trade = useMemo(() => getTrade(id)!, [getTrade]);

	const isPublished = useMemo(
		() => trade.tradeId != null,
		[trade]
	);

	const publishDisabled = useMemo(
		() => trade.id == null,
		[trade]
	);

	const togglePublished = useCallback(async () => {
		if (publishDisabled) return;

		setLoading(true);
		let tradeId: number | null = null;

		if (isPublished) {
			await unpublishJournalTrade(trade.id!);
		} else {
			tradeId = await publishJournalTrade(trade.id!);
		}

		updateTrade(id, { tradeId });
		setLoading(false);

	}, [publishDisabled, trade]);

	return {
		isPublished,
		publishDisabled,
		publishLoading: loading,
		togglePublished,
	} as const;
};

export default usePublishTrade;