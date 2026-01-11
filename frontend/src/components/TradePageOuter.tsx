import { useParams } from "react-router-dom";
import TradeContextProvider from "./TradeContextProvider";
import TradePage from "./TradePage";


export default function TradePageOuter() {
	const { id: tradeId } = useParams();

	return (
		<TradeContextProvider tradeId={Number(tradeId)} >
			<TradePage />
		</TradeContextProvider>
	);
}