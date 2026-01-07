import { Box, Flex, NativeSelect, Text } from "@chakra-ui/react"
import type { SymbolWithId } from "../../../shared/trades.types";
import EditButton from "./EditButton";

type Props = {
	symbols: SymbolWithId[];
	symbolId: string;

	loading: boolean;
	disabled?: boolean;

	handleEditClick?: () => void;
	setSymbolId: React.Dispatch<React.SetStateAction<string>>;
}

export default function SymbolSelect({
	symbols,
	symbolId,
	loading,
	disabled=false,

	handleEditClick,
	setSymbolId,
}: Props) {
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