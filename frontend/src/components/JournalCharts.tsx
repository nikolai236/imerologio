import { Box, Text, Button, Flex, VStack } from '@chakra-ui/react';

import JournalChartPreview from './JournalChartPreview';
import EditButton from './EditButton';
import useJournalCharts from '../hooks/useJournalCharts';
import type { DbSymbol } from '../../../shared/trades.types';
import type { AddTrade, TempJournalTrade } from '../hooks/useJournalTrades';

type Props = {
    parentLoading: boolean;
    symbols: DbSymbol[];
	disabled?: boolean;
    trades: TempJournalTrade[],
    addTrade: AddTrade;
	handleEditClick?: () => void;
};

export default function JournalCharts({
    parentLoading,
    symbols,
	disabled = false,
    trades,
    addTrade,
	handleEditClick,
}: Props) {
    const {
        charts,
        addChart,
        updateChart,
        removeChart,
    } = useJournalCharts();

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
						visible={disabled}
						onClick={handleEditClick ?? (()=>{})}
					/>

					<Button
						variant="outline"
						size="sm"
						onClick={addChart}
						disabled={disabled}
					> Add Chart </Button>

				</Flex>
			</Flex>

			{charts.length === 0 && (
				<Text fontSize="sm" color="fg.muted">
					No charts added. Click &quot;Add Chart&quot; to attach one.
				</Text>
			)}

			<VStack align="stretch" gap={4} mt={charts.length ? 2 : 0}>
			{charts.map((chart, i) =>
				<JournalChartPreview
                    chart={chart}
                    trades={trades}
                    parentLoading={parentLoading}
                    symbols={symbols}
					idx={i+1}
					disabled={disabled}
					key={chart.tempId}
                    addTrade={addTrade}
                    updateChart={updateChart}
                    removeChart={removeChart}
				/>
			)}
			</VStack>
		</Box>);
}