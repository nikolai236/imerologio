import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table, Box } from "@chakra-ui/react";
import type { DbTradeEntry } from "../../../shared/trades.types";
import TradeRow from "./TradeRow";
import useTrades from "../hooks/useTrades";
import PlusButton from "./PlusButton";
import useReload from "../hooks/useReload";

export default function TradesPage() {
	const { getTrades, deleteTrade } = useTrades();
	const [trades, setTrades] = useState<DbTradeEntry[]>([]);
	const [token, reload] = useReload();

	useEffect(() => {
		getTrades()
			.then(setTrades)
			.catch(console.error);
	}, [token]);

	const onDelete = (id: number) => async () => {
		const ok = confirm("Are you sure you want to delete this trade?");
		if (!ok) return;

		await deleteTrade(id);
		reload();
	};

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
					{trades.map((t) =>
						<TradeRow
							key={t.id}
							trade={t}
							onDelete={onDelete(t.id)}
						/>)
					}
				</Table.Body>
			</Table.Root>

			<Link to="create/">
				<PlusButton onClick={() => {}} />
			</Link>
		</Box>
	);
}