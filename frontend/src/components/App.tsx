import { Navigate, Routes, Route, Outlet } from "react-router-dom";
import Trades from "./Trades";
import Navbar from "./Navbar";
import Symbols from "./Symbols";
import Labels from "./Labels";
import TradePageOuter from "./TradePageOuter";
import CreateTradePageOuter from "./CreateTradePageOuter";

function RootLayout() {
	return (<>
		<Navbar />
		<Outlet />
	</>);
}

export default function App() {
	return (
		<Routes>
			<Route element={<RootLayout />}>
				<Route path='/' element={<Navigate to='/trades' replace />} />
				<Route path='trades'>
					<Route index element={<Trades />} />
					<Route path='create' element={<CreateTradePageOuter />} />
					<Route path="/trades/:id" element={<TradePageOuter />} />
				</Route>
				<Route path='symbols' element={<Symbols />} />
				<Route path='labels' element={<Labels />} />
			</Route>
		</Routes>
	);
}