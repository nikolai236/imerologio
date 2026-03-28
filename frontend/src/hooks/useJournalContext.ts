import { useContext } from "react";
import JournalContext from "../context/JournalContext";

const useJournalContext = () => {
	const context = useContext(JournalContext);
	if (context == null) {
		throw new Error("JournalContext is empty");
	}

	return context;
};

export default useJournalContext;