import type { MouseEvent } from "react";
import { IconButton, Table } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import type { DbTradeEntry } from "../../../shared/trades.types";
import { epochToDateStrInTZ } from "../lib/timezones";

type Props = {
	trade: DbTradeEntry
	onDelete: () => Promise<void>;
};

export default function TradeRow({
	trade,
	onDelete
}: Props) {
	const dateStr = trade.orders?.length > 0 ?
		epochToDateStrInTZ(new Date(trade.orders[0].date ?? Date.now()).getTime()) : null;

	const direction = trade.orders?.length > 0 && trade.orders[0].type == 'BUY' ?
		'Long' : 'Short';

	const navigate = useNavigate();
	const goToTradePage = () => navigate(`/trades/${trade.id}`);

	const onClick = async (ev: MouseEvent) => {
		ev.stopPropagation();
		await onDelete();
	}

	return (
		<Table.Row onClick={goToTradePage}>
			<Table.Cell> {trade.id} </Table.Cell>
			<Table.Cell> {trade.symbolId} </Table.Cell>
			<Table.Cell> {dateStr} </Table.Cell>
			<Table.Cell> {direction} </Table.Cell>
			<Table.Cell
				textAlign="end"
				color={!trade.pnl ? 'black' : trade.pnl > 0 ? 'green' : 'red'}
			> {trade.pnl?.toFixed(2)}
			</Table.Cell>
			<Table.Cell textAlign="end">
				<IconButton
					aria-label="Remove chart"
					size="xs"
					variant="ghost"
					onClick={onClick}
				> ✕ </IconButton>
			</Table.Cell>
		</Table.Row>
	);
}