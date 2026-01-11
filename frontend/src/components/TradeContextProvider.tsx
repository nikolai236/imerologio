import type { ReactNode } from "react";
import useEditTrade from "../hooks/useEditTrade";
import TradeContext from "../context/TradeContext";


type Props = {
	children: ReactNode;
	tradeId?: number;
};

export default function TradeContextProvider({
	children,
	tradeId,
}: Props) {
	const value = useEditTrade(tradeId);
	return <TradeContext.Provider value={value}>{children}</TradeContext.Provider>;
}