import { Box, Flex, NativeSelect, Text } from "@chakra-ui/react"
import type { DbSymbol } from "../../../shared/trades.types";
import EditButton from "./EditButton";
import useTradeContext from "../hooks/useTradeContext";

type Props = {	
	loading: boolean;
	disabled?: boolean;

	symbols: DbSymbol[];

	handleEditClick?: () => void;
}

export default function SymbolSelect({
	symbols,
	loading,
	disabled=false,

	handleEditClick,
}: Props) {
	const { symbolId, setSymbolId } = useTradeContext();

	return (
		<Box minW="260px" flex="1">
			<Text fontSize="sm" color="fg.muted" mb={1}>
				Symbol
			</Text>

			<Flex align="center" gap={2}>
				<EditButton
					visible={disabled}
					onClick={handleEditClick ?? (()=>{})}
				/>
				<NativeSelect.Root disabled={loading || disabled}>
					<NativeSelect.Field
						value={symbolId}
						onChange={(e) => setSymbolId(e.target.value)}
					>
						{symbols.map((s) => (
							<option key={s.id} value={String(s.id)}>
								{s.name} ({s.type})
							</option>
						))}
					</NativeSelect.Field>
				</NativeSelect.Root>
			</Flex>
		</Box>
	);
}