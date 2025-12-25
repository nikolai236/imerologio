import {
	DialogRoot,
	DialogBackdrop,
	DialogContent,
	DialogHeader,
	DialogBody,
	DialogFooter,
	DialogTitle,
	DialogPositioner,
	DialogCloseTrigger,
	VStack,
	Input,
	Box,
	Flex,
	Text,
	Button
} from '@chakra-ui/react';
import { useState, type Dispatch, type SetStateAction, useMemo } from 'react';
import type { LabelWithId } from '../../../shared/trades.types';

type Props = {
	labels: LabelWithId[];
	open: boolean;
	selectedIds: number[];
	setSelectedIds: Dispatch<SetStateAction<number[]>>;
	setLabelsOpen: (val: boolean) => void;
}

export default function SelectLabels({
	open,
	selectedIds,
	labels,
	setSelectedIds,
	setLabelsOpen,
}: Props) {
	const [query, setQuery] = useState('');

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return labels.filter(
			l => l.name.toLowerCase().includes(q)
		);
	}, [labels, query]);

	const toggleLabel = (id: number) => setSelectedIds(
		ids => ids.includes(id) ? ids.filter(i => id != i) : [...ids, id]
	);

	const closeDialog = (val: boolean) => {
		setQuery('');
		setLabelsOpen(val);
	};

	return (
		<DialogRoot open={open} onOpenChange={(e) => closeDialog(e.open)}>
			<DialogBackdrop />
			<DialogPositioner>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Select Labels</DialogTitle>
					<DialogCloseTrigger />
				</DialogHeader>

				<DialogBody>
					<VStack align="stretch" gap={3}>
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search labels..."
						/>

						<Box borderWidth="1px" borderRadius="md" maxH="320px" overflowY="auto">
							{filtered.length === 0 ? (
								<Box p={3}>
									<Text color="fg.muted">No labels match your search.</Text>
								</Box>
							) : (
								<VStack align="stretch" gap={0}>
								{filtered.map(l =>
									<Box
										key={l.id}
										px={3}
										py={2}
										borderBottomWidth="1px"
										_last={{ borderBottomWidth: 0 }}
									>
										<Flex align="center" justify="space-between" gap={3}>
											<Box>
												<Text fontWeight="semibold">{l.name}</Text>
												<Text fontSize="xs" color="fg.muted">
													Used in {l.tradesCount} trades
												</Text>
											</Box>

											<Button
												variant={selectedIds.includes(l.id) ? "solid" : "outline"}
												onClick={() => toggleLabel(l.id)}
											>{selectedIds.includes(l.id) ? "Selected" : "Select"}
											</Button>
										</Flex>
									</Box>
								)}
								</VStack>
							)}
						</Box>
					</VStack>
				</DialogBody>

				<DialogFooter>
					<Button variant="outline" onClick={() => closeDialog(false)}>
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
			</DialogPositioner>
		</DialogRoot>
	);
}