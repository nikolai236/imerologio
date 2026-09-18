import { Navigate, Routes, Route, Outlet } from "react-router-dom";
import TradesPage from "./TradesPage";
import Navbar from "./Navbar";
import Symbols from "./Symbols";
import TradePageOuter from "./TradePageOuter";
import CreateTradePageOuter from "./CreateTradePageOuter";
import Scoring from "./Scoring";
import JournalTablePage from "./JournalTablePage";
import CreateJournalEntryPageOuter from "./CreateJournalEntryPageOuter";
import JournalEntryPageOuter from "./JournalEntryPageOuter";
import LabelsPerformancePage from "./LabelsPerformancePage";
import LabelsPageOuter from "./LabelsPageOuter";
import Comparison from "./Comparison";

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
					<Route index element={<LabelsPageOuter />} />
					<Route path="performance" element={<LabelsPerformancePage />} />
				</Route>
				<Route path="scoring">
					<Route index element={<Scoring />} />
					<Route path="comparison" element={<Comparison />} />
				</Route>
				<Route path="journal">
					<Route index element={<JournalTablePage />} />
					<Route path="create" element={<CreateJournalEntryPageOuter />} />
					<Route path=":id" element={<JournalEntryPageOuter />} />
				</Route>
			</Route>
		</Routes>
	);
}