import {
	Box,
	Button,
	CloseButton,
	Flex,
	HStack,
	Input,
	Spinner,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

import {
	Background,
	Controls,
	ReactFlow,
	type Edge,
	type Node,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import type {
	DbLabelEntry,
	DbLabelWithDescendats,
} from "../../../shared/trades.types";

import {
	getLabelWithDescendants,
	getAdjacencyList,
	addChild,
	removeChild,
} from "../api/labels";

type Props = {
	labelId: number | null;
	labels: DbLabelEntry[];
	onClose: () => void;
};

type GraphProps = {
	rootId: number;
	list: Record<number, number[]>;
	labels: DbLabelEntry[];
};

function LabelGraph({
	rootId,
	list,
	labels,
}: GraphProps) {
	const labelMap = useMemo(
		() => new Map(labels.map(({ id, name }) => [id, name])),
		[labels]
	);

	const nodes = useMemo<Node[]>(() => {
		const ids = new Set<number>();
		ids.add(rootId);

		for (const [parent, children] of Object.entries(list)) {
			ids.add(Number(parent));
			children.forEach(c => ids.add(c));
		}

		const depths = new Map<number, number>();
		depths.set(rootId, 0);

		const queue = [rootId];

		while (queue.length > 0) {
			const current = queue.shift()!;
			const depth = depths.get(current) ?? 0;

			for (const child of list[current]) {
				const newDepth = depth + 1;
				const currDepth = depths.get(child);

				if (currDepth == null || newDepth < currDepth) {
					depths.set(child, newDepth);
					queue.push(child);
				}
			}
		}

		const levels = new Map<number, number[]>();
		for (const id of ids) {
			const depth = depths.get(id) ?? 0;
			const level = levels.get(depth) ?? [];

			level.push(id);
			levels.set(depth, level);
		}

		const result: Node[] = [];

		for (const [depth, level] of levels) {
			level.forEach((id, index) => {
				const width = 180;
				const offset = ((level.length - 1) * width) / 2;

				result.push({
					id: String(id),
					data: {
						label: labelMap.get(id) ?? `Label ${id}`,
					},
					position: {
						x: index * width - offset,
						y: depth * 120,
					},
					style: {
						minWidth: 120,
						alignItems: "center",
						justifyContent: "center",
						borderRadius: "50%",
						textAlign: "center",
						fontWeight: id === rootId ? 700 : 500,
						border: id === rootId ? "2px solid #3182ce" : "1px solid #aaa",
					},
				});
			});
		}

		return result;
	}, [rootId, list, labelMap]);

	const edges = useMemo<Edge[]>(
		() => Object.entries(list).flatMap(([parent, children]) =>
			children.map((child) => ({
				id: `${parent}-${child}`,
				source: String(parent),
				target: String(child),
			}))),
		[list]
	);

	return (
		<Box w="100%" h="400px">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				fitView
				nodesDraggable={false}
				nodesConnectable={false}
			>
				<Background />
				<Controls />
			</ReactFlow>
		</Box>
	);
}

export default function EditLabelChildren({
	labelId,
	labels,
	onClose,
}: Props) {
	const [label, setLabel] = useState<DbLabelWithDescendats | null>(null);
	const [list, setList] = useState<Record<number, number[]>>({});
	const [query, setQuery] = useState("");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadData = async (id: number) => {
		const [currentLabel, currentAdjList] = await Promise.all([
			getLabelWithDescendants(id),
			getAdjacencyList(id),
		]);

		setLabel(currentLabel);
		setList(currentAdjList);
	};

	useEffect(() => {
		if (labelId == null) {
			setLabel(null);
			setList({});
			setQuery("");
			setError(null);

			return;
		}

		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				await loadData(labelId);
			} catch (err: any) {
				console.error(err);
				setError(err?.message ?? "Failed to load label");
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [labelId]);

	useEffect(() => {
		if (labelId == null) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener(
			"keydown", handleKeyDown
		);
	}, [labelId, onClose]);

	const availableLabels = useMemo(() => {
		if (label == null) return [];

		const descIds = new Set(label.descendants.map(d => d.id));
		return labels.filter(
			l => l.id !== label.id && !descIds.has(l.id)
		);
	}, [label, labels]);

	const filteredLabels = useMemo(() => {
		const q = query.trim().toLowerCase();

		return availableLabels.filter(
			cand => cand.name.toLowerCase().includes(q)
		);
	}, [availableLabels, query,]);

	const handleAdd = async (child: DbLabelEntry) => {
		if (label == null) return;

		setError(null);
		try {
			await addChild(label.id, child.id);
			await loadData(label.id);

			setQuery("");
		} catch (err: any) {
			setError(err?.message ?? `Failed to add "${child.name}" as a child`);
		}
	};

	const handleRemove = async (child: DbLabelEntry) => {
		if (label == null) return;

		setError(null);
		try {
			await removeChild(label.id,child.id);
			await loadData(label.id);
		} catch (err: any) {
			setError(err?.message ?? `Failed to remove "${child.name}"`);
		}
	};

	const close = () => {
		setQuery("");
		setError(null);
		onClose();
	};

	if (labelId == null) return null;

	return (
		<Box position="fixed" inset={0} zIndex={1000}>
			<Box
				position="absolute"
				inset={0}
				bg="blackAlpha.500"
				onClick={close}
			/>

			<Box
				position="absolute"
				top="5%"
				left="50%"
				transform="translateX(-50%)"
				w="900px"
				maxW="95vw"
				maxH="90vh"
				overflowY="auto"
				bg="bg.panel"
				borderWidth="1px"
				borderColor="border"
				borderRadius="xl"
				shadow="2xl"
				p={6}
			>
				<VStack align="stretch" gap={6}>
					<Flex justify="space-between" align="center">
						<Box>
							<Text
								fontSize="lg"
								fontWeight="bold"
							> Edit child labels </Text>

							{label && (
								<Text fontSize="sm" color="fg.muted">
									Manage children of{" "}
									<Text as="span" fontWeight="semibold">
										{label.name}
									</Text>
								</Text>
							)}
						</Box>

						<CloseButton onClick={close} />
					</Flex>

					{loading && (
						<Flex justify="center" py={8}>
							<Spinner />
						</Flex>
					)}

					{error && (
						<Box
							p={3}
							borderWidth="1px"
							borderColor="red.300"
							borderRadius="md"
						> <Text color="red.500">{error}</Text>
						</Box>
					)}

					{!loading && label && (
						<>
							<Box>
								<Text
									fontSize="xs"
									fontWeight="semibold"
									textTransform="uppercase"
									color="fg.muted"
									mb={2}
								> Descendant graph </Text>

								<Box borderWidth="1px" borderRadius="lg" overflow="hidden">
									<LabelGraph
										rootId={label.id}
										list={list}
										labels={labels}
									/>
								</Box>
							</Box>

							<Box>
								<Text
									fontSize="xs"
									fontWeight="semibold"
									textTransform="uppercase"
									color="fg.muted"
									mb={2}
								> Current children </Text>

								<Flex gap={2} flexWrap="wrap">
								{(list[label.id] ?? []).map((childId) => {
									const child = labels.find(l => l.id === childId);
									if (!child) return null;

									return (
										<HStack
											key={child.id}
											borderWidth="1px"
											borderRadius="full"
											px={3}
											py={1.5}
										>
											<Text>{child.name}</Text>
											<CloseButton
												size="xs"
												onClick={() => handleRemove(child)}
											/>
										</HStack>
									);
								})}
								</Flex>
							</Box>

							<Box>
								<Text
									fontSize="xs"
									fontWeight="semibold"
									textTransform="uppercase"
									color="fg.muted"
									mb={2}
								> Add child </Text>

								<Input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search labels..."
									mb={3}
								/>
								<Box
									borderWidth="1px"
									borderRadius="lg"
									maxH="300px"
									overflowY="auto"
								>
									<VStack align="stretch"gap={0}>
									{filteredLabels.map((item) => (
										<Flex
											key={item.id}
											p={3}
											justify="space-between"
											align="center"
											borderBottomWidth="1px"
										>
											<Box>
												<Text fontWeight="semibold">
													{item.name}
												</Text>

												<Text fontSize="xs" color="fg.muted">
													Used in {item.tradeCount} trades
												</Text>
											</Box>

											<Button
												size="sm"
												variant="outline"
												onClick={() => handleAdd(item)}
											> Add </Button>
										</Flex>
									))}
									</VStack>
								</Box>
							</Box>

							<Flex justify="flex-end">
								<Button variant="outline" onClick={close}> Done </Button>
							</Flex>
						</>
					)}
				</VStack>
			</Box>
		</Box>
	);
}