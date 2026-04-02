import { createContext } from "react";

import type useJournalTrades from "../hooks/useJournalTrades";
import type useJournalCharts from "../hooks/useJournalCharts";
import type useJournalEntry from "../hooks/useJournalEntry";
import type { DbSymbol } from "../../../shared/trades.types";
import type useFetchLabels from "../hooks/useFetchLabels";

type ContextType =
	ReturnType<typeof useJournalCharts> &
	ReturnType<typeof useJournalTrades> &
	ReturnType<typeof useFetchLabels> &
	ReturnType<typeof useJournalEntry> & {
		symbols: DbSymbol[];
    	loadingSymbols: boolean;
	}

const JournalContext = createContext<ContextType | null>(null);
export default JournalContext;