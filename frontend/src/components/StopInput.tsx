import { Box, Text, Input, Flex } from "@chakra-ui/react"
import EditButton from "./EditButton";
import { usePriceDraft, type Price } from "../hooks/useDraft";

type Props = {
	stop: number | null;
	setStop: (stop: Price) => void;
	disabled?: boolean;
	handleEditClick?: () => void;
};

export default function StopInput({
	stop,
	setStop,
	disabled = false,
	handleEditClick,
}: Props) {
	const {
		draft,
		setDraft,
		saveDraft,
	} = usePriceDraft(stop, setStop);

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
					onBlur={() => saveDraft()}
					onChange={e => setDraft(e.target.value)}
					placeholder="e.g. 19250.25"
				/>
			</Flex>
		</Box>
	);
}