import { Navigate, Routes, Route, Outlet } from "react-router-dom";
import Trades from "./Trades";
import Navbar from "./Navbar";
import Symbols from "./Symbols";
import Labels from "./Labels";
import CreateTrade from "./CreateTrade";

function RootLayout() {
	return (
		<>
			<Navbar />
			<Outlet />
		</>
	);
}

export default function App() {
	return (
		<Routes>
			<Route element={<RootLayout />}>
				<Route path='/' element={<Navigate to='/trades' replace />} />
				<Route path='trades'>
					<Route index element={<Trades />} />
					<Route path='create' element={<CreateTrade />} />
				</Route>
				<Route path='symbols' element={<Symbols />} />
				<Route path='labels' element={<Labels />} />
			</Route>
			{/* <Route path="/trades/:id" element={<TradePage />} /> */}
		</Routes>
	);
}