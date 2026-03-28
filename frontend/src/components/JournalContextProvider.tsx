import type { ReactNode } from "react";
import JournalContext from "../context/JournalContext";
import useJournalTrades from "../hooks/useJournalTrades";
import useJournalCharts from "../hooks/useJournalCharts";


type Props = {
	children: ReactNode;
};

export default function JournalContextProvider({
	children,
}: Props) {
	const value = {
		...useJournalTrades(),
		...useJournalCharts(),
	} as const;

	return (
		<JournalContext.Provider value={value}>
			{children}
		</JournalContext.Provider>
	);
}