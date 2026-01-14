import { Box, Text, Input, Flex } from "@chakra-ui/react"
import EditButton from "./EditButton";
import useTradeContext from "../hooks/useTradeContext";
import useDraft from "../hooks/useDraft";

type Props = {
	disabled?: boolean;
	handleEditClick?: () => void;
}

export default function StopInput({
	disabled = false,
	handleEditClick,
}: Props) {
	const { stop, setStop } = useTradeContext();
	const [draft, setDraft] = useDraft(stop);

	return (
		<Box minW="160px">
			<Text fontSize="sm" color="fg.muted" mb={1}>
				Stop
			</Text>

			<Flex align="center" gap={2}>
				<EditButton
					visible={disabled}
					onClick={handleEditClick ?? (()=>{})}
				/>
				<Input
					value={draft}
					disabled={disabled}
					onBlur={() => setStop(Number(draft.trim()))}
					onChange={e => setDraft(e.target.value)}
					placeholder="e.g. 19250.25"
				/>
			</Flex>
		</Box>
	);
}