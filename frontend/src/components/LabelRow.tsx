import {
	Box,
	Input,
	Flex,
	Text,
	HStack,
	Button,
	Textarea,
} from "@chakra-ui/react";
import { memo, useMemo, useState } from "react";
import type { DbLabelEntry, UpdateLabel } from "../../../shared/trades.types";
import useLabelsContext from "../hooks/useLabelsContext";
import { updateLabel } from "../api/labels";

type Props = {
	label: DbLabelEntry;
	isEditing: boolean;

	editChildren: (id: number) => void;
	setEditingId: (id: number | null) => void
	onDelete: () => void;
};

function LabelRow({
	label,
	editChildren,
	onDelete,
}: Props) {
	const {
		labels,
		reloadLabels,

		rowErrorById,
		setRowError,
		clearRowError,

		editingId,
		setEditingId,
	} = useLabelsContext();

	const error = useMemo(
		() => rowErrorById[label.id] ?? null,
		[rowErrorById]
	);

	const isEditing = useMemo(
		() => label.id === editingId,
		[editingId]
	);

	const [draftName, setDraftName] = useState(label.name);
	const [draftDescription, setDraftDescription] = useState(
		label.description ?? ""
	);

	const startEdit = () => {
		setEditingId(label.id);
		setDraftName(label.name);
		setDraftDescription(label.description ?? "");
		clearRowError(label.id);
	};

	const cancelEdit = () => {
		clearRowError(label.id);
		setEditingId(null);
	};

	const onDraftNameChange = (value: string) => {
		setDraftName(value);
		clearRowError(label.id);
	};

	const saveEdit = async () => {
		const { id } = label;

		const name = draftName.trim();
		if (name == "") {
			return setRowError(id, "Name cannot be empty.");
		}

		const description = draftDescription.trim() || null;

		const hasDuplicate = labels
			.filter(l => l.id != id)
			.some(l => l.name == name);

		if (hasDuplicate) {
			setRowError(id, "A label with that name already exists.");
			return;
		}

		try {
			const payload: UpdateLabel = { name, description };
			await updateLabel(id, payload);
		} catch (_err) {
			setRowError(id, "Couldn't save change.");
			return;
		}

		reloadLabels();

		clearRowError(id);
		setEditingId(null);
	};

	return (
		<Box borderWidth="1px" borderRadius="md" p={4}>
			{error ? (
				<Box mb={3} p={2} borderWidth="1px" borderRadius="md">
					<Text color="red.400">{error}</Text>
				</Box>
			) : null}

			<Flex align="center" gap={4} wrap="wrap">
				<Box minW="80px">
					<Text fontSize="sm" color="fg.muted">
						ID
					</Text>
					<Text fontWeight="semibold">{label.id}</Text>
				</Box>

				<Box minW="220px" flex="1">
					<Text fontSize="sm" color="fg.muted">
						Name
					</Text>

					{isEditing ? (
						<Input
							value={draftName}
							onChange={(e) =>
								onDraftNameChange(e.target.value)
							}
							placeholder="Label name"
							maxW="360px"
						/>
					) : (
						<Text fontWeight="semibold">{label.name}</Text>
					)}
				</Box>

				<Box minW="80px">
					<Text fontSize="sm" color="fg.muted">
						Trades Count
					</Text>
					<Text fontWeight="semibold">{label.tradeCount}</Text>
				</Box>

				<Button
					variant="outline"
					onClick={() => editChildren(label.id)}
				>
					Edit Child Labels
				</Button>

				<HStack>
					{isEditing ? (
						<>
							<Button onClick={saveEdit}>
								Save
							</Button>

							<Button
								variant="outline"
								onClick={cancelEdit}
							>
								Cancel
							</Button>
						</>
					) : (
						<>
							<Button
								variant="outline"
								onClick={startEdit}
							>
								Edit
							</Button>

							<Button
								colorScheme="red"
								variant="outline"
								onClick={onDelete}
							>
								Delete
							</Button>
						</>
					)}
				</HStack>
			</Flex>

			{isEditing ? (
				<Box mt={4}>
					<Text
						fontSize="sm"
						color="fg.muted"
						mb={1}
					>
						Description
					</Text>

					<Textarea
						value={draftDescription}
						onChange={(e) =>
							setDraftDescription(e.target.value)
						}
						placeholder="Label description"
						resize="vertical"
					/>
				</Box>
			) : label.description ? (
				<Box mt={4}>
					<Text
						fontSize="sm"
						color="fg.muted"
						mb={1}
					>
						Description
					</Text>

					<Text whiteSpace="pre-wrap">
						{label.description}
					</Text>
				</Box>
			) : null}
		</Box>
	);
}

export default memo(LabelRow);