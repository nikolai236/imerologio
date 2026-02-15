import { Box, VStack, Text, Button } from "@chakra-ui/react";

type Props = {
	menu?: {
		x: number;
		y: number;
		price: number;
	},
	onClose: () => void;
};


export default function CopyMenu({
	menu, onClose
}: Props) {
	if (!menu) return null;

	const { x, y, price } = menu;

	const copy = async () => {
		const text = price.toString();

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
					Price: <b>{price}</b>
				</Text>

				<Button size="sm" onClick={copy}>
					Copy
				</Button>
			</VStack>
		</Box>
	);
}