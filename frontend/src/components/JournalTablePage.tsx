import { useEffect, useState } from "react";
import {
	Box,
	Heading,
	Spinner,
	Table,
	Text,
} from "@chakra-ui/react";
import { getJournalEntries, type ApiJournalEntry } from "../api/journal";
import { Link, useNavigate } from "react-router-dom";
import PlusButton from "./PlusButton";

const formatDateTime = (value: string | Date) =>
	new Date(value).toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

export default function JournalTablePage() {
	const [entries, setEntries] = useState<ApiJournalEntry[]>([]);
	const [loading, setLoading] = useState(true);

	const navigate = useNavigate();

	useEffect(() => {
		setLoading(true);

		getJournalEntries()
			.then(setEntries)
			.catch(console.error)
			.finally(() => setLoading(false));

	}, []);

	const goToEntryPage = (entry: ApiJournalEntry) => () => {
		navigate(`/journal/${entry.id}`);
	};

	return (
		<Box p={6}>
			<Heading size="lg" mb={6}>
				Journal Entries
			</Heading>

			{loading ? (
				<Box p={8} display="flex" justifyContent="center">
					<Spinner />
				</Box>
			) : entries.length === 0 ? (
				<Box p={8}>
					<Text color="fg.muted">No journal entries found.</Text>
				</Box>
			) : (
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.ColumnHeader>Title</Table.ColumnHeader>
							<Table.ColumnHeader>From</Table.ColumnHeader>
							<Table.ColumnHeader>To</Table.ColumnHeader>
							<Table.ColumnHeader textAlign="right">
								Trades
							</Table.ColumnHeader>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{entries.map((entry) => (
							<Table.Row key={entry.id} onClick={goToEntryPage(entry)}>
								<Table.Cell>
									<Text fontWeight="bold">
										{entry.title}
									</Text>
								</Table.Cell>

								<Table.Cell>
									{formatDateTime(entry.from)}
								</Table.Cell>

								<Table.Cell>
									{formatDateTime(entry.to)}
								</Table.Cell>

								<Table.Cell textAlign="right">
									{entry.trades.length}
								</Table.Cell>
							</Table.Row>
						))}
					</Table.Body>
				</Table.Root>
			)}

			<Link to="create/">
				<PlusButton onClick={() => {}} />
			</Link>
		</Box>
	);
}