import { useMemo, useState } from "react";
import {
	Box,
	Flex,
	Heading,
	Spacer,
	Stack,
	Text,
} from "@chakra-ui/react";
import SymbolRow from "./SymbolRow";
import { type SymbolEnum, type DbSymbol, type Symbol } from "../../../shared/trades.types";
import useSymbols from "../hooks/useSymbols";
import CreateSymbolPage from "./CreateSymbol";
import useRowErrors from "../hooks/useRowErrors";
import useFetchSymbols from "../hooks/useFetchSymbols";

export default function Symbols() {
	const { updateSymbol, createSymbol } = useSymbols();
	const { rowErrorById, setRowError, clearRowError } = useRowErrors();
	const { symbols: unsorted, reload } = useFetchSymbols();

	const symbols = useMemo(() => {
		const cmp = (a: Symbol, b: Symbol) => a.name.localeCompare(
			b.name,
			undefined,
			{ sensitivity: 'base' }
		);
		return [...unsorted].sort(cmp);
	}, [unsorted]);

	const [editingId, setEditingId] = useState<number|null>(null);

	const [draftName, setDraftName] = useState('');
	const [draftType, setDraftType] = useState<SymbolEnum>('Futures');
	const [draftDescription, setDraftDescription] = useState('');

	const startEdit = (symbol: DbSymbol) => {
		setEditingId(symbol.id);
		setDraftDescription(symbol.description);
		setDraftName(symbol.name);
		setDraftType(symbol.type);
		clearRowError(symbol.id);
	};

	const cancelEdit = () => {
		if (editingId != null) clearRowError(editingId);
		setEditingId(null);
	};

	const updateDraft = (id: number, payload: Partial<Symbol>) => {
		if (editingId !== id) return;

		if (payload.name) setDraftName(payload.name);
		if (payload.description) setDraftDescription(payload.description);
		if (payload.type) setDraftType(payload.type);

		clearRowError(id);
	};

	const saveNewSymbol = async (symbol: Symbol) => {
		if (symbol.name == '') {
			throw new Error("Name cannot be empty.");
		}

		const hasDuplicate = unsorted
			.filter(s => s != symbol)
			.some(s => s.name == symbol.name);

		if (hasDuplicate) {
			throw new Error("A symbol with that name already exists.");
		}
	
		await createSymbol(symbol);
		reload();
	};

	const saveEdit = async (id: number) => {
		if (editingId !== id) return;

		const name = draftName.trim();
		if (name == '') {
			return setRowError(id, "Name cannot be empty.");
		}

		const hasDuplicate = unsorted
			.filter(s => s.id != id)
			.some(s => s.name == name);

		if (hasDuplicate) {
			setRowError(id, "A symbol with that name already exists.");
			return;
		}

		const description = draftDescription.trim();

		try {
			await updateSymbol(id, { name, type: draftType, description });
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
				<Heading size="md">Symbols</Heading>
				<Spacer />
				<Text color="fg.muted">{symbols.length} total</Text>
			</Flex>

			<Stack gap={3}>
			{symbols.map((s) => {
				const isEditing = editingId === s.id
				return (
					<SymbolRow
						key={s.id}
						symbol={s}
						isEditing={isEditing}
						name={isEditing ? draftName : s.name}
						description={draftDescription}
						type={isEditing ? draftType : s.type}
						error={rowErrorById[s.id] ?? null}
						onStartEdit={startEdit}
						onCancelEdit={cancelEdit}
						updateDraft={updateDraft}
						onSave={saveEdit}
					/>) })}
			</Stack>
			<CreateSymbolPage onCreate={saveNewSymbol} />
		</Box>
	);
}
