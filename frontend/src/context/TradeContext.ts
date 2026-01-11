import { createContext } from "react";
import type useEditTrade from "../hooks/useEditTrade";

type ContextType = ReturnType<typeof useEditTrade>;

const TradeContext = createContext<ContextType|null>(null);
export default TradeContext;