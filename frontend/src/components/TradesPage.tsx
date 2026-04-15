import { useEffect, useState } from "react";
import { Table, Box, Spinner, HStack } from "@chakra-ui/react";
import { Link, useSearchParams } from "react-router-dom";

import type { DbTradeEntry } from "../../../shared/trades.types";

import TradeRow from "./TradeRow";
import PlusButton from "./PlusButton";
import DatePicker from "./DatePicker";

import useReload from "../hooks/useReload";

import { getTrades, deleteTrade } from "../api/trades";

const parseIsoParam = (param: string | null, fallabck: number) => {
	if (!param) return fallabck;
	const time = new Date(param).getTime();
	return time || fallabck;
};

export default function TradesPage() {
	const [loading, setLoading] = useState(false);

	const [searchParams, setSearchParams] = useSearchParams();

	const [from, setFrom] = useState(() =>
		parseIsoParam(searchParams.get("from"), 1)
	);
	const [to, setTo] = useState(() =>
		parseIsoParam(searchParams.get("to"), Date.now())
	);

	const [trades, setTrades] = useState<DbTradeEntry<Date>[]>([]);
	const [token, reload] = useReload();

	useEffect(() => {
		const currentFrom = searchParams.get("from");
		const currentTo = searchParams.get("to");

		const nextFrom = new Date(from).toISOString();
		const nextTo = new Date(to).toISOString();

		if (
			currentFrom === nextFrom &&
			currentTo === nextTo
		) return;

		const next = new URLSearchParams(searchParams);
		next.set("from", nextFrom);
		next.set("to", nextTo);

		setSearchParams(next, { replace: true });
	}, [from, to, searchParams]);

	useEffect(() => {
		setLoading(true);

		getTrades(from, to)
			.then(setTrades)
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [token, from, to]);

	const onDelete = (id: number) => async () => {
		const ok = confirm("Are you sure you want to delete this trade?");
		if (!ok) return;

		await deleteTrade(id);
		reload();
	};

	return (
		<Box p={6}>
			<HStack mb={4} gap={3} align="start">
				<Box w="500px" flexShrink={0}>
					<DatePicker
						label="From date"
						epoch={from}
						onChangeEpoch={(d) => setFrom(d ?? Date.now())}
					/>
				</Box>

				<Box w="500px" flexShrink={0}>
					<DatePicker
						label="To date"
						epoch={to}
						onChangeEpoch={(d) => setTo(d ?? Date.now())}
					/>
				</Box>
			</HStack>

			{loading ? (
				<Box p={8} display="flex" justifyContent="center">
					<Spinner />
				</Box>
			) : (
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
			)}

			<Link to="create/">
				<PlusButton onClick={() => {}} />
			</Link>
		</Box>
	);
}