import { Box, Text, Input, Flex } from "@chakra-ui/react"
import EditButton from "./EditButton";

type Props = {
	stop: string;
	disabled?: boolean;

	handleEditClick?: () => void;
	setStop: React.Dispatch<React.SetStateAction<string>>
}

export default function StopInput({
	stop,
	disabled = false,

	handleEditClick,
	setStop,
}: Props) {
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
					value={stop}
					onChange={(e) => setStop(e.target.value)}
					placeholder="e.g. 19250.25"
				/>
			</Flex>

		</Box>)
}