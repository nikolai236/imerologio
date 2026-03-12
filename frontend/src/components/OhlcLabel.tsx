import { Box } from '@chakra-ui/react';
import type { OhlcLabel } from "../hooks/useOhlcLabel";

export default function OhlcLabel({ values }: { values?: OhlcLabel|null }) {
	if (!values) return null;

	return (
		<Box
			position="absolute"
			top="8px"
			left="8px"
			zIndex={10}
			pointerEvents="none" 
			px="2"
			py="1"
			fontSize="xs"
			fontFamily="mono"
			bg="transparent"
			color="black"
			borderRadius="sm"
		>
			O {values.open.toFixed(6)}{" "}
			H {values.high.toFixed(6)}{" "}
			L {values.low.toFixed(6)} {" "}
			C {values.close.toFixed(6)}
		</Box>
	);
}