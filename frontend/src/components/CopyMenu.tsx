import { Box, VStack, Text, Button } from "@chakra-ui/react";
import type { CopyMenuContext } from "../hooks/useCopyMenu";

type Props = {
	context?: CopyMenuContext,
	onClose: () => void;
};

export default function CopyMenu({
	context, onClose
}: Props) {
	if (!context) return null;

	const { x, y, price } = context;

	const copy = async () => {
		const text = price.toFixed(4);

		await navigator.clipboard.writeText(text);

		onClose();
	};

	return (
		<Box
			position="absolute"
			left={`${x}px`}
			top={`${y}px`}
			zIndex={1000}
			bg="gray.900"
			color="white"
			borderRadius="md"
			borderWidth="1px"
			borderColor="whiteAlpha.200"
			boxShadow="lg"
			p={2}
			minW="180px"
		>
			<VStack align="stretch" gap={2}>
				<Text fontSize="sm">
					Price: <b>{price.toFixed(4)}</b>
				</Text>

				<Button size="sm" onClick={copy}>
					Copy
				</Button>
			</VStack>
		</Box>
	);
}