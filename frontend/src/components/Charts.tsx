import { Box, Text, Button, Flex, VStack } from '@chakra-ui/react';
import ChartPreview from './ChartPreview';
import type { SymbolWithId, } from '../../../shared/trades.types';
import EditButton from './EditButton';
import useTradeContext from '../hooks/useTradeContext';

type Props = {
	symbols: SymbolWithId[];
	disabled?: boolean;
	handleEditClick?: () => void;
};

export default function Charts({
	symbols,
	disabled = false,
	handleEditClick,
}: Props) {
	const { addChart, charts, symbolId, isSupported } = useTradeContext();
	const disabledForEdits = !isSupported;

	return (
		<Box>
			<Flex justify="space-between" align="center" mb={3}>
				<Box>
					<Text fontSize="sm" color="fg.muted">
						Charts
					</Text>
					<Text fontSize="xs" color="fg.muted">
						Attach any number of chart previews to this trade.
					</Text>
				</Box>

				<Flex align="center" gap={2}>
					<EditButton
						visible={!disabledForEdits && disabled}
						onClick={handleEditClick ?? (()=>{})}
					/>

					<Button
						variant="outline"
						size="sm"
						onClick={addChart}
						disabled={disabled || disabledForEdits}
					> Add Chart </Button>

				</Flex>
			</Flex>

			{charts.length === 0 && (
				<Text fontSize="sm" color="fg.muted">
					No charts added. Click &quot;Add Chart&quot; to attach one.
				</Text>
			)}

			<VStack align="stretch" gap={4} mt={charts.length ? 2 : 0}>
			{charts.map((c, i) =>
				<ChartPreview
					num={i+1}
					timeframe={c.timeframe}
					symbol={symbols.find(s => s.id == Number(symbolId))!.name}
					disabled={disabledForEdits || disabled}
					id={c.tempId}
					key={c.tempId}
					start={c.start}
					end={c.end}
				/>
			)}
			</VStack>
		</Box>);
}