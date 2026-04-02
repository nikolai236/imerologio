import {
	Input,
	Box,
	Flex,
	VStack,
	Text,
	Button,
	HStack,
	DialogHeader,
	DialogBody,
	DialogFooter,
	DialogRoot,
	DialogTitle,
	DialogPositioner,
	DialogBackdrop,
	DialogContent,
	DialogCloseTrigger,
} from '@chakra-ui/react';
import { useState, useMemo } from 'react';
import type { DbLabelEntry } from '../../../shared/trades.types';
import { createLabel } from "../api/labels";

type Props = {
	labels: DbLabelEntry[];
	open: boolean;
	tradeId?: number;
	allowCreate?: boolean;
	disabled?: boolean;
	selectedIds: number[];

	setSelectedIds: (update: ((ids: number[]) => number[]) | number[]) => void;
	handleEditClick?: () => void;
	setOpen: (value: boolean) => void;
	reloadLabels: () => void;
};

export default function SelectLabels({
	open,
	labels,
	allowCreate = true,
	tradeId,
	selectedIds,

	setSelectedIds,
	setOpen,
	reloadLabels,
}: Props) {	
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const toggleLabel = (id: number) =>
		setSelectedIds(ids => (ids.includes(id) ? ids.filter(i => id != i) : [...ids, id]));

	const closeDialog = (val: boolean) => {
		setQuery("");
		setError(null);
		setOpen(val);
	};

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return labels.filter(l => l.name.toLowerCase().includes(q));
	}, [labels, query]);

	const exactMatch = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return null;
		return labels.find(l => l.name.trim().toLowerCase() === q) ?? null;
	}, [labels, query]);

	const canCreate = useMemo(() => {
		const q = query.trim();
		return allowCreate && q.length > 0 && !exactMatch;
	}, [query, exactMatch]);

	const onCreate = async () => {
		const name = query.trim();
		if (!name || !canCreate) return;

		try {
			setLoading(true);
			setError(null);

			const newLabel = await createLabel({
				name,
				tradeIds: tradeId != null ? [tradeId] : [],
			});

			setSelectedIds(ids => ids.includes(newLabel.id) ?
				ids : [...ids, newLabel.id]
			);

			setQuery("");
		} catch (e: any) {
			setError(e?.message ?? "Failed to create label");
		} finally {
			reloadLabels();
			setLoading(false);
		}
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
							<HStack align="stretch" gap={2}>
								<Input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search labels..."
								/>
								<Button
									onClick={onCreate}
									disabled={!canCreate || loading}
									loading={loading}
								>
									New label
								</Button>
							</HStack>

							{error && (
								<Text fontSize="sm" color="fg.error">
									{error}
								</Text>
							)}
							{canCreate && (
								<Text fontSize="sm" color="fg.muted">
									Create “{query.trim()}”
								</Text>
							)}
							{exactMatch && (
								<Text fontSize="sm" color="fg.muted">
									Label already exists — select it below.
								</Text>
							)}

							<Box borderWidth="1px" borderRadius="md" maxH="320px" overflowY="auto">
								{filtered.length === 0 ? (
									<Box p={3}>
										<Text color="fg.muted">No labels match your search.</Text>
									</Box>
								) : (
									<VStack align="stretch" gap={0}>
										{filtered.map((l) => (
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
															Used in {l.tradeCount} trades
														</Text>
													</Box>

													<Button
														variant={selectedIds.includes(l.id) ? 'solid' : 'outline'}
														onClick={() => toggleLabel(l.id)}
													>
														{selectedIds.includes(l.id) ? 'Selected' : 'Select'}
													</Button>
												</Flex>
											</Box>
										))}
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