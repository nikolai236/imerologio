import { Box, Text, Input, Flex } from "@chakra-ui/react"
import EditButton from "./EditButton";

type Props = {
	target: string;
	disabled?: boolean;

	handleEditClick?: () => void;
	setTarget: React.Dispatch<React.SetStateAction<string>>
}

export default function TargetInput({
	target,
	disabled = false,

	handleEditClick,
	setTarget,
}: Props) {
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
					value={target}
					onChange={(e) => setTarget(e.target.value)}
					placeholder="e.g. 19310.00"
				/>
			</Flex>

		</Box>)
}