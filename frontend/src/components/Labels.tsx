import { useState } from "react";
import {
	Box,
	Flex,
	Heading,
	Spacer,
	Stack,
	Text,
} from "@chakra-ui/react";
import useLabels from "../hooks/useLabels";
import type { DbLabel, Label } from "../../../shared/trades.types";
import LabelRow from "./LabelRow";
import useRowErrors from "../hooks/useRowErrors";
import CreateLabel from "./CreateLabel";
import useFetchLabels from "../hooks/useFetchLabels";

export default function Labels() {
	const {
		deleteLabel,
		updateLabel,
		createLabel,
	} = useLabels();

	const { rowErrorById, setRowError, clearRowError } = useRowErrors();
	const { labels, reload } = useFetchLabels();

	const [draftName, setDraftName] = useState('');
	const [editingId, setEditingId] = useState<number|null>(null);

	const startEdit = (label: DbLabel) => {
		setEditingId(label.id);
		setDraftName(label.name);
		clearRowError(label.id);
	};

	const cancelEdit = () => {
		if (editingId != null) clearRowError(editingId);
		setEditingId(null);
	};

	const onDraftNameChange = (id: number, value: string) => {
		if (editingId !== id) return;
		setDraftName(value);
		clearRowError(id);
	};

	const onDelete = (id: number) => {
		deleteLabel(id)
			.then(() => reload())
			.catch(console.error);
	};

	const saveNewLabel = async (label: Label) => {
		if (label.name == '') {
			throw new Error("Name cannot be empty.");
		}

		const hasDuplicate = labels
			// @ts-ignore
			.filter(l => l != label)
			.some(s => s.name == label.name);

		if (hasDuplicate) {
			throw new Error("A label with that name already exists.");
		}
	
		await createLabel(label);
		reload();
	};

	const saveEdit = async (id: number) => {
		if (editingId !== id) return;

		const name = draftName.trim();
		if (name == '') {
			return setRowError(id, "Name cannot be empty.");
		}

		const hasDuplicate = labels
			.filter(l => l.id != id)
			.some(l => l.name == name);

		if (hasDuplicate) {
			setRowError(id, "A label with that name already exists.");
			return;
		}

		try {
			await updateLabel(id, { name });
		} catch (_err) {
			setRowError(id, "Couldn't save change.");
			return;
		}

		reload();

		clearRowError(id);
		setEditingId(null);
	};

	return (
		<Box p={6}>
			<Flex align="center" mb={4}>
				<Heading size="md">Labels</Heading>
				<Spacer />
				<Text color="fg.muted">{labels.length} total</Text>
			</Flex>

			<Stack gap={3}>
			{labels.map((l) => {
				const isEditing = editingId === l.id
				return (
					<LabelRow
						key={l.id}
						label={l}
						isEditing={isEditing}
						draftName={isEditing ? draftName : l.name}
						error={rowErrorById[l.id] ?? null}
						onDelete={onDelete}
						onStartEdit={startEdit}
						onCancelEdit={cancelEdit}
						onDraftNameChange={onDraftNameChange}
						onSave={saveEdit}
					/>)
			})}
			</Stack>
			<CreateLabel onCreate={saveNewLabel} />
		</Box>
	);
}
