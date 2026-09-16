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
import CreateLabel from "./CreateLabel";

import { deleteLabel, createLabel } from "../api/labels";
import EditLabelChildren from "./EditLabelChildren";
import useLabelsContext from "../hooks/useLabelsContext";

export default function LabelsPage() {
	const {
		labels,
		editingId,
		setEditingId,
		reloadLabels,
		setEditChildrenId
	} = useLabelsContext();

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
						label={l}
						isEditing={isEditing}

						editChildren={setEditChildrenId}
						onDelete={() => onDelete(l)}
						setEditingId={setEditingId}
					/>)
			})}
			</Stack>
			<CreateLabel onCreate={saveNewLabel} />
			<EditLabelChildren />
		</Box>
	);
}
