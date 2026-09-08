import { useState } from "react";
import {
	Box,
	Flex,
	Heading,
	Spacer,
	Stack,
	Text,
} from "@chakra-ui/react";
import type { DbLabelEntry, Label } from "../../../shared/trades.types";
import LabelRow from "./LabelRow";
import useRowErrors from "../hooks/useRowErrors";
import CreateLabel from "./CreateLabel";

import { deleteLabel, updateLabel, createLabel } from "../api/labels";
import EditLabelChildren from "./EditLabelChildren";
import useLabelsContext from "../hooks/useLabelsContext";

export default function LabelsPage() {
	const {
		labels,
		reloadLabels,
		setEditChildrenId,
	} = useLabelsContext();

	const { rowErrorById, setRowError, clearRowError } = useRowErrors();

	const [draftName, setDraftName] = useState("");
	const [editingId, setEditingId] = useState<number|null>(null);

	const startEdit = (label: DbLabelEntry) => {
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

	const onDelete = (label: DbLabelEntry) => {
		const msg = `Are you sure you want to delete label: "${label.name}"?`;

		const ok = confirm(msg);
		if (!ok) return;

		deleteLabel(label.id)
			.then(() => reloadLabels())
			.catch(console.error);
	};

	const saveNewLabel = async (label: Label) => {
		if (label.name == "") {
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
		reloadLabels();
	};

	const saveEdit = async (id: number) => {
		if (editingId !== id) return;

		const name = draftName.trim();
		if (name == "") {
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

		reloadLabels();

		clearRowError(id);
		setEditingId(null);
	};

	return (
		<Box p={6} position="relative">
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
						editChildren={setEditChildrenId}
					/>)
			})}
			</Stack>
			<CreateLabel onCreate={saveNewLabel} />
			<EditLabelChildren />
		</Box>
	);
}
