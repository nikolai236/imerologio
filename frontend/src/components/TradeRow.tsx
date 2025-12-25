import { Table } from "@chakra-ui/react";
import type { TradeWithId, TradeWithOrders } from "../../../shared/trades.types";

export default function TradeRow(props: { trade: TradeWithId }) {
  const { trade } = props;
  const direction = trade.orders[0].type == 'BUY' ? 'Long' : 'Short';

  return (
    <Table.Row>
      <Table.Cell>{trade.symbolId}</Table.Cell>
      <Table.Cell>{trade.orders[0].date.toISOString()}</Table.Cell>
      <Table.Cell>{direction}</Table.Cell>
      <Table.Cell textAlign="end">{trade.pnl}</Table.Cell>
    </Table.Row>
  );
}