import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table, Box } from "@chakra-ui/react";
import type { TradeWithId } from "../../../shared/trades.types";
import TradeRow from "./TradeRow";
import useTrades from "../hooks/useTrades";
import PlusButton from "./PlusButton";

export default function Trades() {
	const { getTrades } = useTrades();
	const [trades, setTrades] = useState<TradeWithId[]>([]);

	useEffect(() => {
		getTrades().then(setTrades).catch(console.error);
	}, []);

	return (
		<Box p={6}>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeader>SymbolId</Table.ColumnHeader>
						<Table.ColumnHeader>Date</Table.ColumnHeader>
						<Table.ColumnHeader>Side</Table.ColumnHeader>
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