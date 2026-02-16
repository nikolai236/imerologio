import type { ReactNode } from "react";
import useTradePayload from "../hooks/useTradePayload";
import TradeContext from "../context/TradeContext";


type Props = {
	children: ReactNode;
	tradeId?: number;
};

export default function TradeContextProvider({
	children,
	tradeId,
}: Props) {
	const value = useTradePayload(tradeId);
	return <TradeContext.Provider value={value}>{children}</TradeContext.Provider>;
}