import CreateTradePage from "./CreateTradePage";
import TradeContextProvider from "./TradeContextProvider";

export default function CreateTradePageOuter() {
    return (
        <TradeContextProvider>
            <CreateTradePage />
        </TradeContextProvider>
    )
}