import { useContext } from "react";
import JournalChartContext from "../context/JournalChartContext";

const useJournalChartContext = () => {
	const context = useContext(JournalChartContext);
	if (context == null) {
		throw new Error("TradeContext is empty");
	}

	return context;
};

export default useJournalChartContext;