import { Table } from "@chakra-ui/react";
import type { DbTradeEntry } from "../../../shared/trades.types";
import useTimezones from "../hooks/useTimezones";
import { useNavigate } from "react-router-dom";

export default function TradeRow({ trade }: { trade: DbTradeEntry }) {
	const { epochToDateStrInTZ } = useTimezones();

	const dateStr = trade.orders?.length > 0 ?
		epochToDateStrInTZ(new Date(trade.orders[0].date ?? Date.now()).getTime()) : null;

	const direction = trade.orders?.length > 0 && trade.orders[0].type == 'BUY' ?
		'Long' : 'Short';

	const navigate = useNavigate();
	const goToTradePage = () => navigate(`/trades/${trade.id}`);

	return (
		<Table.Row onClick={goToTradePage}>
			<Table.Cell> {trade.id} </Table.Cell>
			<Table.Cell> {trade.symbolId} </Table.Cell>
			<Table.Cell> {dateStr} </Table.Cell>
			<Table.Cell> {direction} </Table.Cell>
			<Table.Cell
				textAlign="end"
				color={!trade.pnl ? 'black' : trade.pnl > 0 ? 'green' : 'red'}
			>
				{trade.pnl}
			</Table.Cell>
		</Table.Row>
	);
}