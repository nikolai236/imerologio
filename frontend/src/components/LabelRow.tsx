import { Box, Input, Flex, NativeSelect, Text, HStack, Button } from "@chakra-ui/react";
import { type LabelWithId, type SymbolEnum, type SymbolWithId } from "../../../shared/trades.types";

type Props = {
	label: LabelWithId;
	isEditing: boolean;
	draftName: string;
	error?: string | null;

	onStartEdit: (label: LabelWithId) => void;
	onDelete: (id: number) => void;
	onCancelEdit: () => void;
	onDraftNameChange: (id: number, value: string) => void;
	onSave: (id: number) => void;
};

export default function LabelRow({
	label,
	isEditing,
	draftName,
	error,

	onStartEdit,
	onCancelEdit,
	onDraftNameChange,
	onDelete,
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
					<Text fontWeight="semibold">{label.id}</Text>
				</Box>

				<Box minW="220px" flex="1">
					<Text fontSize="sm" color="fg.muted">
						Name
					</Text>
					{isEditing ? (
						<Input
							value={draftName}
							onChange={(e) => onDraftNameChange(label.id, e.target.value)}
							placeholder="Symbol name"
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
					<Text fontWeight="semibold">{label.tradesCount}</Text>
				</Box>

				<HStack>
					{isEditing ? (
						<>
							<Button onClick={() => onSave(label.id)}>Save</Button>
							<Button variant="outline" onClick={onCancelEdit}>
								Cancel
							</Button>
						</>
					) : (
						<>
							<Button variant="outline" onClick={() => onStartEdit(label)}>
								Edit
							</Button>
							<Button
								colorScheme="red"
								variant="outline"
								onClick={() => onDelete(label.id)}
							>
								Delete
							</Button>
						</>
					)}
				</HStack>

			</Flex>
		</Box>
	);
}