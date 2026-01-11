import { Box, Flex, Text, Button, HStack, Tag, CloseButton } from "@chakra-ui/react"
import EditButton from "./EditButton"
import type { LabelWithId } from "../../../shared/trades.types";
import useTradeContext from "../hooks/useTradeContext";
import { useMemo } from "react";

type Props = {
	loading: boolean;
	disabled?: boolean;
	labels: LabelWithId[];

	handleEditClick?: ()=>void;
	setOpen: (val: boolean) => void;
}

export default function SelectLabelButton({
	loading,
	disabled=false,
	labels,

	setOpen,
	handleEditClick,
}: Props) {
	const {
		selectedLabelIds: selectedIds,
		setSelectedLabelIds: setLabelIds,
	} = useTradeContext();

	const removeLabel = (id: number) => setLabelIds(
		(prev) => prev.filter((x) => x !== id)
	);

	const selected = useMemo(
		() => selectedIds
			.map((id) => labels.find((l) => l.id === id)!)
			.filter(Boolean),
		[selectedIds, labels]
	);

	return (
		<Box>
			<Flex align="center" justify="space-between" wrap="wrap" gap={3}>
				<Box>
					<Text fontSize="sm" color="fg.muted">
						Labels
					</Text>

					<Text fontSize="xs" color="fg.muted">
						Selected {selectedIds.length}
					</Text>
				</Box>

				<Flex align="center" gap={2}>
					<EditButton
						visible={disabled}
						onClick={handleEditClick ?? (()=>{})}
					/>
					<Button
						variant="outline"
						onClick={() => setOpen(true)}
						disabled={disabled || loading}
						> Add / Search Labels
					</Button>
				</Flex>

			</Flex>

			{selected.length ? (
				<HStack mt={3} wrap="wrap" gap={2}>
					{selected.map((l) => (
						<Tag.Root key={l.id} borderRadius="full">
							<Tag.Label>{l.name}</Tag.Label>
							{disabled ? null : (
								<CloseButton
									size="sm"
									ml={1}
									onClick={() => removeLabel(l.id)}
									aria-label={`Remove ${l.name}`}
								/>
							)}
						</Tag.Root>
					))}
				</HStack>
			) : (
				<Text mt={3} color="fg.muted" fontSize="sm">
					No labels selected.
				</Text>
			)}
		</Box>
	)
}