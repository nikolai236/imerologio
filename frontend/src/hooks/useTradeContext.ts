import { useContext } from "react";
import TradeContext from "../context/TradeContext";

const useTradeContext = () => {
	const context = useContext(TradeContext);
	if (context == null) {
		throw new Error("TradeContext is empty");
	}

	return context;
};

export default useTradeContext;