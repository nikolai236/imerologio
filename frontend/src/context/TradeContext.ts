import { createContext } from "react";
import type useTradePayload from "../hooks/useTradePayload";

type ContextType = ReturnType<typeof useTradePayload>;

const TradeContext = createContext<ContextType|null>(null);
export default TradeContext;