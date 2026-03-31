import { createContext } from "react";
import type useJournalTrades from "../hooks/useJournalTrades";
import type useJournalCharts from "../hooks/useJournalCharts";

type ContextType =
	ReturnType<typeof useJournalCharts> &
	ReturnType<typeof useJournalTrades>;

const JournalContext = createContext<ContextType | null>(null);
export default JournalContext;