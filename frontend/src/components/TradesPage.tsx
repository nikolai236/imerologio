import { useEffect, useRef, useState } from "react";
import { Table, Box, VStack } from "@chakra-ui/react";
import { Link } from "react-router-dom";

import type { DbTradeEntry } from "../../../shared/trades.types";

import TradeRow from "./TradeRow";
import PlusButton from "./PlusButton";
import DatePicker from "./DatePicker";

import useTrades from "../hooks/useTrades";
import useReload from "../hooks/useReload";

export default function TradesPage() {
	const { getTrades, deleteTrade } = useTrades();

	const [from, setFrom] = useState<number>(Date.now());
	const [to, setTo] = useState<number>(Date.now());

	const [trades, setTrades] = useState<DbTradeEntry[]>([]);
	const [token, reload] = useReload();

	const isFormInitialized = useRef(false);

	useEffect(() => {
		if (!isFormInitialized.current) {
			getTrades()
				.then(setTrades)
				.catch(console.error);

			return;
		}

		getTrades(from, to)
			.then(setTrades)
			.catch(console.error);
	}, [token, from, to]);

	useEffect(() => {
		if (isFormInitialized.current || trades.length == 0) return;

		const dates = trades.map(t =>
			new Date(t.orders[0].date ?? Date.now()).getTime()
		);
		dates.push(Date.now());
		setFrom(Math.min(...dates));

		isFormInitialized.current = true;
	}, [trades]);

	const onDelete = (id: number) => async () => {
		const ok = confirm("Are you sure you want to delete this trade?");
		if (!ok) return;

		await deleteTrade(id);
		reload();
	};

	return (
		<Box p={6}>
			<VStack mb={4} gap={3} align="start">
				<DatePicker
					label="From date"
					maxW="500px"
					epoch={from}
					onChangeEpoch={(d) => setFrom(d ?? Date.now())}
				/>
				<DatePicker
					label="To date"
					maxW="500px"
					epoch={to}
					onChangeEpoch={(d) => setTo(d ?? Date.now())}
				/>
			</VStack>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeader>Id</Table.ColumnHeader>
						<Table.ColumnHeader>Symbol</Table.ColumnHeader>
						<Table.ColumnHeader>Date</Table.ColumnHeader>
						<Table.ColumnHeader>Direction</Table.ColumnHeader>
						<Table.ColumnHeader textAlign="end">PNL</Table.ColumnHeader>
						<Table.ColumnHeader></Table.ColumnHeader>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{trades.map((t) =>
						<TradeRow
							key={t.id}
							trade={t}
							onDelete={onDelete(t.id)}
						/>
					)}
				</Table.Body>
			</Table.Root>

			<Link to="create/">
				<PlusButton onClick={() => {}} />
			</Link>
		</Box>
	);
}