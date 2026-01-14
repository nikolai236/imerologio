import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table, Box } from "@chakra-ui/react";
import type { DbTradeEntry } from "../../../shared/trades.types";
import TradeRow from "./TradeRow";
import useTrades from "../hooks/useTrades";
import PlusButton from "./PlusButton";

export default function TradesPage() {
	const { getTrades } = useTrades();
	const [trades, setTrades] = useState<DbTradeEntry[]>([]);

	useEffect(() => {
		getTrades()
			.then(setTrades)
			.catch(console.error);
	}, []);

	return (
		<Box p={6}>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeader>Id</Table.ColumnHeader>
						<Table.ColumnHeader>Symbol</Table.ColumnHeader>
						<Table.ColumnHeader>Date</Table.ColumnHeader>
						<Table.ColumnHeader>Direction</Table.ColumnHeader>
						<Table.ColumnHeader textAlign="end">PNL</Table.ColumnHeader>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{trades.map((t, key) => <TradeRow key={key} trade={t} />)}
				</Table.Body>
			</Table.Root>

			<Link to="create/">
				<PlusButton onClick={() => {}} />
			</Link>
		</Box>
	);
}