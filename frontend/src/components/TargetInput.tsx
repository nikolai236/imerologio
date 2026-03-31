import { Box, Text, Input, Flex } from "@chakra-ui/react"
import EditButton from "./EditButton";
import { usePriceDraft, type Price } from "../hooks/useDraft";

type Props = {
	target: number | null,
	setTarget: (target: Price) => void;
	disabled?: boolean;
	handleEditClick?: () => void;
}

export default function TargetInput({
	target,
	setTarget,
	disabled = false,
	handleEditClick,
}: Props) {
	const {
		draft,
		setDraft,
		saveDraft
	} = usePriceDraft(target, setTarget);

	return (
		<Box minW="160px">
			<Text fontSize="sm" color="fg.muted" mb={1}>
				Target (optional)
			</Text>

			<Flex align="center" gap={2}>
				<EditButton
					visible={disabled}
					onClick={handleEditClick ?? (()=>{})}
				/>
				<Input
					value={Number(draft).toFixed(3)}
					disabled={disabled}
					onBlur={() => saveDraft()}
					onChange={e => setDraft(e.target.value)}
					placeholder="e.g. 19310.00"
				/>
			</Flex>
		</Box>);
}