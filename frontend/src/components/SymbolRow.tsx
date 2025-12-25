import { Box, Input, Flex, NativeSelect, Text, HStack, Button } from "@chakra-ui/react";
import { type SymbolEnum, type SymbolWithId } from "../../../shared/trades.types";

type Props = {
	symbol: SymbolWithId;
	isEditing: boolean;
	draftName: string;
	draftType: SymbolEnum;
	error?: string | null;

	onStartEdit: (symbol: SymbolWithId) => void;
	onCancelEdit: () => void;
	onDraftNameChange: (id: number, value: string) => void;
	onDraftTypeChange: (id: number, value: SymbolEnum) => void;
	onSave: (id: number) => void;
};

const TYPE_OPTIONS: SymbolEnum[] = ["Futures", "CFD"];

export default function SymbolRow({
	symbol,
	isEditing,
	draftName,
	draftType,
	error,

	onStartEdit,
	onCancelEdit,
	onDraftNameChange,
	onDraftTypeChange,
	onSave,
}: Props) {
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
					<Text fontWeight="semibold">{symbol.id}</Text>
				</Box>

				<Box minW="220px" flex="1">
					<Text fontSize="sm" color="fg.muted">
						Name
					</Text>
					{isEditing ? (
						<Input
							value={draftName}
							onChange={(e) => onDraftNameChange(symbol.id, e.target.value)}
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
									value={draftType}
									onChange={(e) =>
										onDraftTypeChange(symbol.id, e.currentTarget.value as SymbolEnum)
									}
								>
									{TYPE_OPTIONS.map((t) => (<option key={t} value={t}>{t}</option>))}
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
		</Box>
	);
}