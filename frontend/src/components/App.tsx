import { Navigate, Routes, Route, Outlet } from "react-router-dom";
import TradesPage from "./TradesPage";
import Navbar from "./Navbar";
import Symbols from "./Symbols";
import Labels from "./Labels";
import TradePageOuter from "./TradePageOuter";
import CreateTradePageOuter from "./CreateTradePageOuter";
import Scoring from "./Scoring";
import JournalTablePage from "./JournalTablePage";
import CreateJournalEntryPageOuter from "./CreateJournalEntryPageOuter";
import JournalEntryPageOuter from "./JournalEntryPageOuter";
import LabelsPerformancePage from "./LabelsPerformancePage";

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
				<Route path="/" element={<Navigate to="/trades" replace />} />
				<Route path="trades">
					<Route index element={<TradesPage />} />
					<Route path="create" element={<CreateTradePageOuter />} />
					<Route path=":id" element={<TradePageOuter />} />
				</Route>
				<Route path="symbols" element={<Symbols />} />
				<Route path="labels">
					<Route index element={<Labels />} />
					<Route path="performance" element={<LabelsPerformancePage />} />
				</Route>
				<Route path="scoring" element={<Scoring />} />
				<Route path="journal">
					<Route index element={<JournalTablePage />} />
					<Route path="create" element={<CreateJournalEntryPageOuter />} />
					<Route path=":id" element={<JournalEntryPageOuter />} />
				</Route>
			</Route>
		</Routes>
	);
}