import {
	Box,
	Button,
	Flex,
	Text,
	VStack,
} from "@chakra-ui/react";
import {
	Children,
	cloneElement,
	useState,
	type ReactElement,
} from "react";

import useEditLock from "../hooks/useEditLock";
import useTradeContext from "../hooks/useTradeContext";
import useFetchSymbols from "../hooks/useFetchSymbols";
import useFetchLabels from "../hooks/useFetchLabels";

import SelectLabels from "./SelectLabels";
import DescriptionEditor from "./DescriptionEditor";
import SelectLabelButton from "./SelectLabelButton";
import Charts from "./Charts";
import SymbolSelect from "./SymbolSelect";
import StopInput from "./StopInput";
import TargetInput from "./TargetInput";
import Orders from "./Orders";

const Sections = {
	symbol: "symbol",
	stop: "stop",
	target: "target",
	labels: "labels",
	orders: "orders",
	description: "description",
	charts: "charts",
} as const;

export default function TradePage() {
	const { labels, loadingLabels   } = useFetchLabels();
	const { symbols, loadingSymbols } = useFetchSymbols();

	const { formError, submitting, submitTradeEdit } = useTradeContext();
	const { isActive, setActive, lockAll } = useEditLock();

	const [labelsOpen, setLabelsOpen] = useState(false);

	type WrapperChildBase = {
		disabled: boolean;
		handleEditClick?: () => void
	};

	type WrapperProps<P extends WrapperChildBase> = {
		section: typeof Sections[keyof typeof Sections];
		children: ReactElement<P>;
	};

	function SectionWrapper<P extends WrapperChildBase>({ section, children }: WrapperProps<P>) {
		const child = Children.only(children);

		return cloneElement(child, {
			disabled: !isActive(section),
			handleEditClick: setActive(section),
		} as P);
	}

	return (
		<Box p={6} maxW="1000px" mx="auto">
			<Text fontSize="2xl" fontWeight="bold" mb={4}>
				Create Trade
			</Text>

			{formError ? (
				<Box mb={4} p={3} borderWidth="1px" borderRadius="md">
					<Text color="red.400">{formError}</Text>
				</Box>
			) : null}

			<VStack align="stretch" gap={5}>
				<Flex gap={4} wrap="wrap" align="flex-end">

					<SectionWrapper section={Sections.symbol}>
						<SymbolSelect symbols={symbols} loading={loadingSymbols} />
					</SectionWrapper>

					<SectionWrapper section={Sections.stop}>
						<StopInput />
					</SectionWrapper>

					<SectionWrapper section={Sections.target}>
						<TargetInput />
					</SectionWrapper>

				</Flex>

				<SectionWrapper section={Sections.labels}>
					<SelectLabelButton
						loading={loadingLabels}
						setOpen={setLabelsOpen}
						labels={labels} />
				</SectionWrapper>

				<Box borderBottomWidth="1px" />

				<SectionWrapper section={Sections.orders}>
					<Orders />
				</SectionWrapper>
				

				<Box borderBottomWidth="1px" />

				<SectionWrapper section={Sections.description}>
					<DescriptionEditor placeholder="Write your trade notes…" />
				</SectionWrapper>

				<Box borderBottomWidth="1px" />

				<SectionWrapper section={Sections.charts}>
					<Charts symbols={symbols} />
				</SectionWrapper>

				<Box borderBottomWidth="1px" />

				<Flex justify="flex-end" gap={3}>
					<Button variant="outline" onClick={lockAll}>
						Cancel
					</Button>
					<Button
						onClick={submitTradeEdit}
						loading={submitting}
						disabled={submitting}
					>
						Submit Change
					</Button>
				</Flex>
			</VStack>

			<SelectLabels
				labels={labels}
				open={labelsOpen}
				setOpen={setLabelsOpen} />
		</Box>
	);
}