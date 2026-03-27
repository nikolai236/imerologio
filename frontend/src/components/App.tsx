import { Navigate, Routes, Route, Outlet } from "react-router-dom";
import TradesPage from "./TradesPage";
import Navbar from "./Navbar";
import Symbols from "./Symbols";
import Labels from "./Labels";
import TradePageOuter from "./TradePageOuter";
import CreateTradePageOuter from "./CreateTradePageOuter";
import Scoring from "./Scoring";
import JournalTablePage from "./JournalTablePage";
import CreateJournalEntryPage from "./CreateJournalEntryPage";

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
					<Route index element={<TradesPage />} />
					<Route path='create' element={<CreateTradePageOuter />} />
					<Route path="/trades/:id" element={<TradePageOuter />} />
				</Route>
				<Route path='symbols' element={<Symbols />} />
				<Route path='labels' element={<Labels />} />
				<Route path="scoring" element={<Scoring />} />
				<Route path="journal">
					<Route index element={<JournalTablePage />} />
					<Route path="create" element={<CreateJournalEntryPage />} />
				</Route>
			</Route>
		</Routes>
	);
}