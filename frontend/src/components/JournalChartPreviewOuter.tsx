import type { DbSymbol } from "../../../shared/trades.types";
import type { TempJournalChart } from "../hooks/useJournalCharts";
import JournalChartContextProvider from "./JournalChartContextProvider";
import JournalChartPreview from "./JournalChartPreview";

type Props = {
	idx: number;
	chart: TempJournalChart,

	symbols: DbSymbol[];
	parentLoading: boolean;

	disabled?: boolean;
};

export default function JournalChartPreviewOuter({
	idx,
	chart,
	symbols,
	parentLoading,
	disabled = false,
}: Props) {
	return (
		<JournalChartContextProvider chart={chart}>
			<JournalChartPreview
				disabled={disabled}
				parentLoading={parentLoading}
				symbols={symbols}
				idx={idx}
			/>
		</JournalChartContextProvider>
	)
}