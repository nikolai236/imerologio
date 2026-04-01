import type { ReactNode } from "react";
import JournalContext from "../context/JournalContext";
import useJournalTrades from "../hooks/useJournalTrades";
import useJournalCharts from "../hooks/useJournalCharts";
import useFetchSymbols from "../hooks/useFetchSymbols";
import useJournalEntry from "../hooks/useJournalEntry";

type Props = {
	children: ReactNode;
	entryId?: number;
};

export default function JournalContextProvider({
	children, entryId
}: Props) {
	const { symbols, loadingSymbols } = useFetchSymbols();

	const chartObj = useJournalCharts();
	const tradeObj = useJournalTrades();

	const { charts, setCharts } = chartObj;
	const { trades, setTrades } = tradeObj;

	const createObj = useJournalEntry(
		charts, trades, symbols, setCharts, setTrades, entryId
	);

	const value = {
		symbols,
		loadingSymbols,
		...chartObj,
		...tradeObj,
		...createObj,
	} as const;

	return (
		<JournalContext.Provider value={value}>
			{children}
		</JournalContext.Provider>
	);
}