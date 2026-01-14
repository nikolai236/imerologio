import { Box } from '@chakra-ui/react';
import type { Ohlc } from "../hooks/useOhlc";

export default function OhlcLabel({ ohlc }: { ohlc?: Ohlc|null }) {
	if (!ohlc) return null;

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
			O {ohlc.open.toFixed(6)}{" "}
			H {ohlc.high.toFixed(6)}{" "}
			L {ohlc.low.toFixed(6)} {" "}
			C {ohlc.close.toFixed(6)}
		</Box>
	);
}