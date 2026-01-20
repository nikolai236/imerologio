import {
	Box,
	Input,
	Flex,
	NativeSelect,
	Text,
	HStack,
	Button,
	Textarea
} from "@chakra-ui/react";
import {
	type SymbolEnum,
	type DbSymbol,
	type Symbol,
	SymbolTypeValues
} from "../../../shared/trades.types";

type Props = {
	symbol: DbSymbol;
	isEditing: boolean;
	name: string;
	description: string,
	type: SymbolEnum;
	error?: string | null;

	onStartEdit: (symbol: DbSymbol) => void;
	onCancelEdit: () => void;
	updateDraft: (id: number, payload: Partial<Symbol>) => void;
	onSave: (id: number) => void;
};

export default function SymbolRow({
	symbol,
	isEditing,
	name,
	type,
	description,
	error,

	onStartEdit,
	onCancelEdit,
	updateDraft,
	onSave,
}: Props) {
	const { id } = symbol;

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
					<Text fontWeight="semibold">{id}</Text>
				</Box>

				<Box minW="220px" flex="1">
					<Text fontSize="sm" color="fg.muted">
						Name
					</Text>
					{isEditing ? (
						<Input
							value={name}
							onChange={(e) => updateDraft(id, { name: e.target.value })}
							placeholder="Symbol name"
							maxW="360px"
						/>
					) : (
						<Text fontWeight="semibold">{symbol.name}</Text>
					)}
				</Box>

				<Box minW="180px">
					<Text fontSize="sm" color="fg.muted">
						Type
					</Text>
					{isEditing ? (
					<NativeSelect.Root maxW="220px">

						<NativeSelect.Field
							value={type}
							onChange={(e) => updateDraft(id, {
								type: e.currentTarget.value as SymbolEnum
							})}
						> {SymbolTypeValues.map((t) => (<option key={t} value={t}>{t}</option>))}
						</NativeSelect.Field>

						<NativeSelect.Indicator />
					</NativeSelect.Root>
					) : (
					<Text fontWeight="semibold">{symbol.type}</Text>
					)}
				</Box>

				<HStack>
				{isEditing ? (
				<>
					<Button onClick={() => onSave(symbol.id)}>Save</Button>
					<Button variant="outline" onClick={onCancelEdit}>
						Cancel
					</Button>
				</>
				) : (
				<Button variant="outline" onClick={() => onStartEdit(symbol)}>
					Edit
				</Button>
				)}
				</HStack>
			</Flex>

			{(symbol.description?.trim() || isEditing) &&
			<Box mt={4}>
				<Text fontSize="sm" color="fg.muted" mb={1}>
				Description
				</Text>

				{isEditing ? (
				<Textarea
					value={description}
					onChange={(e) => updateDraft(id, {
						description: e.target.value
					})}
					placeholder="Short description (plain text)"
					resize="vertical"
					rows={2} />
				) : (
				<Text whiteSpace="pre-wrap"> {symbol.description} </Text>
				)}
			</Box>
			}
		</Box>
	);
}