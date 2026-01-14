import { Box, Text, Input, Flex } from "@chakra-ui/react"
import EditButton from "./EditButton";
import useTradeContext from "../hooks/useTradeContext";
import useDraft from "../hooks/useDraft";

type Props = {
	disabled?: boolean;
	handleEditClick?: () => void;
}

export default function TargetInput({
	disabled = false,
	handleEditClick,
}: Props) {
	const { target, setTarget } = useTradeContext();
	const [draft, setDraft] = useDraft(target);

	const saveTarget = () => {
		const d = draft.trim();
		setTarget(d ? Number(d) : null);
	};

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
					value={draft}
					disabled={disabled}
					onBlur={saveTarget}
					onChange={e => setDraft(e.target.value)}
					placeholder="e.g. 19310.00"
				/>
			</Flex>
		</Box>);
}