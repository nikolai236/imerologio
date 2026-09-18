import {
	Badge,
	Box,
	Button,
	Flex,
	Heading,
	HStack,
	SimpleGrid,
	Stat,
	Table,
	Tabs,
	Text,
	Wrap,
	WrapItem,
} from "@chakra-ui/react";
import { useCallback, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

import type {
	ComparisonEntry,
	ComparisonReport,
	TradeScoringData,
} from "../../../shared/trades.types";
import SelectLabels from "./SelectLabels";
import { getComparison } from "../api/labels";
import useFetchLabels from "../hooks/useFetchLabels";
import SelectLabelButton from "./SelectLabelButton";

type ComparisonType =
	| "generalized"
	| "exclusion"
	| "replacement"
	| "insertion";

type SeasonalityMode = "month" | "weekday" | "hour";

type SeasonalityRow = {
	key: string;
	label: string;
	trades: number;
	winRate: number;
	totalPnl: number;
	averagePnl: number;
};

const fmt = (x: number) =>
	new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 2,
	}).format(x);

const fmtInt = (x: number) =>
	new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 0,
	}).format(x);

const fmtPercent = (x: number) => `${fmt(x * 100)}%`;

const fmtSigned = (x: number) => `${x > 0 ? "+" : ""}${fmt(x)}`;

const fmtSignedPercent = (x: number) =>
	`${x > 0 ? "+" : ""}${fmt(x * 100)}%`;

const fmtPf = (x: number | null) => (x == null ? "∞" : fmt(x));

type DeltaProps = {
	value: number;
	percent?: boolean;
	neutral?: boolean;
};

function Delta({
	value,
	percent = false,
	neutral = false
}: DeltaProps) {
	if (Math.abs(value) < 0.000001) {
		return (
			<Text fontSize="xs" opacity={0.55}>
				—
			</Text>
		);
	}

	return (
		<Text
			fontSize="xs"
			fontWeight="medium"
			color={
				neutral
					? "fg.muted"
					: value > 0
						? "green.fg"
						: "red.fg"
			}
		>
			{percent ? fmtSignedPercent(value) : fmtSigned(value)}
		</Text>
	);
}

type LabelBadgesProps = {
	ids: number[];
	getName: (id: number) => string;
	excluded?: boolean;
};

function LabelBadges({
	ids,
	getName,
	excluded = false,
}: LabelBadgesProps) {
	if (!ids.length) {
		return (
			<Text fontSize="sm" opacity={0.5}>
				—
			</Text>
		);
	}

	return (
		<Wrap>
		{ids.map((id) => (
			<WrapItem key={id}>
				<Badge
					variant={excluded ? "outline" : "subtle"}
					borderRadius="full"
					px={2}
					py={0.5}
				>
					{excluded && "× "}
					{getName(id)}
				</Badge>
			</WrapItem>
		))}
		</Wrap>
	);
}

function LabelCombination({
	entry,
	getName,
}: {
	entry: ComparisonEntry;
	getName: (id: number) => string;
}) {
	return (
		<Flex direction="column" gap={2}>
			{entry.include.length > 0 && (
				<Flex gap={2} align="start">
					<Text
						fontSize="xs"
						opacity={0.6}
						minW="48px"
						pt="3px"
					>
						include
					</Text>

					<LabelBadges
						ids={entry.include}
						getName={getName}
					/>
				</Flex>
			)}

			{entry.exclude.length > 0 && (
				<Flex gap={2} align="start">
					<Text
						fontSize="xs"
						opacity={0.6}
						minW="48px"
						pt="3px"
					>
						exclude
					</Text>

					<LabelBadges
						ids={entry.exclude}
						getName={getName}
						excluded
					/>
				</Flex>
			)}
		</Flex>
	);
}

function OriginalSummary({
	entry,
	getName,
}: {
	entry: ComparisonEntry;
	getName: (id: number) => string;
}) {
	return (
		<Box
			bg="bg.surface"
			borderWidth="1px"
			borderColor="border.default"
			borderRadius="lg"
			p={4}
		>
			<Flex
				justify="space-between"
				align="start"
				gap={4}
				wrap="wrap"
				mb={5}
			>
				<Box>
					<Heading size="sm" mb={3}>
						Original combination
					</Heading>

					<LabelCombination
						entry={entry}
						getName={getName}
					/>
				</Box>

				<Badge variant="outline">
					{fmtInt(entry.tradeIds.length)} trades
				</Badge>
			</Flex>

			<SimpleGrid
				columns={{ base: 2, md: 3, lg: 6 }}
				gap={4}
			>
				<MetricStat
					label="Support"
					value={fmtInt(entry.support)}
				/>

				<MetricStat
					label="Win rate"
					value={fmtPercent(entry.winRate)}
				/>

				<MetricStat
					label="Average risk"
					value={fmt(entry.averageRisk)}
				/>

				<MetricStat
					label="Total PnL"
					value={fmtSigned(entry.totalPnl)}
				/>

				<MetricStat
					label="Profit factor"
					value={fmtPf(entry.profitFactor)}
				/>

				<MetricStat
					label="μIn"
					value={entry.muIn != null ? fmt(entry.muIn) : "—"}
				/>
			</SimpleGrid>
		</Box>
	);
}

function MetricStat({
	label,
	value,
}: {
	label: string;
	value: string;
}) {
	return (
		<Box
			bg="bg.canvas"
			borderWidth="1px"
			borderColor="border.default"
			borderRadius="md"
			p={3}
		>
			<Stat.Root>
				<Stat.Label>{label}</Stat.Label>
				<Stat.ValueText>{value}</Stat.ValueText>
			</Stat.Root>
		</Box>
	);
}

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const WEEKDAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

function buildSeasonality(
	tradeIds: number[],
	tradesById: Map<number, TradeScoringData>,
	mode: SeasonalityMode,
): SeasonalityRow[] {
	const groups = new Map<string, TradeScoringData[]>();

	for (const id of tradeIds) {
		const trade = tradesById.get(id);

		if (!trade) continue;

		const date = new Date(trade.date);

		let key: string;
		let label: string;

		switch (mode) {
			case "month": {
				const month = date.getMonth();

				key = String(month);
				label = MONTHS[month];

				break;
			}

			case "weekday": {
				const weekday = date.getDay();

				key = String(weekday);
				label = WEEKDAYS[weekday];

				break;
			}

			case "hour": {
				const hour = date.getHours();

				key = String(hour);
				label =
					`${String(hour).padStart(2, "0")}:00–` +
					`${String((hour + 1) % 24).padStart(2, "0")}:00`;

				break;
			}
		}

		const arr = groups.get(key) ?? [];

		arr.push(trade);

		groups.set(key, arr);
	}

	return [...groups.entries()]
		.map(([key, group]) => {
			const pnl = group.map((trade) => trade.pnl ?? 0);

			const totalPnl = pnl.reduce(
				(sum, value) => sum + value,
				0,
			);

			const wins = pnl.filter((value) => value > 0).length;

			let label: string;

			if (mode === "month") {
				label = MONTHS[Number(key)];
			} else if (mode === "weekday") {
				label = WEEKDAYS[Number(key)];
			} else {
				const hour = Number(key);

				label =
					`${String(hour).padStart(2, "0")}:00–` +
					`${String((hour + 1) % 24).padStart(2, "0")}:00`;
			}

			return {
				key,
				label,
				trades: group.length,
				winRate:
					group.length > 0
						? wins / group.length
						: 0,
				totalPnl,
				averagePnl:
					group.length > 0
						? totalPnl / group.length
						: 0,
			};
		})
		.sort((a, b) => Number(a.key) - Number(b.key));
}

function SeasonalityTable({
	tradeIds,
	tradesById,
}: {
	tradeIds: number[];
	tradesById: Map<number, TradeScoringData>;
}) {
	const [mode, setMode] =
		useState<SeasonalityMode>("month");

	const rows = useMemo(
		() => buildSeasonality(tradeIds, tradesById, mode),
		[tradeIds, tradesById, mode],
	);

	return (
		<Box>
			<Flex
				justify="space-between"
				align="center"
				gap={4}
				wrap="wrap"
				mb={3}
			>
				<Heading size="sm">Seasonality</Heading>

				<Tabs.Root
					value={mode}
					onValueChange={(e) =>
						setMode(e.value as SeasonalityMode)
					}
					variant="enclosed"
					size="sm"
				>
					<Tabs.List>
						<Tabs.Trigger value="month">
							Month
						</Tabs.Trigger>

						<Tabs.Trigger value="weekday">
							Weekday
						</Tabs.Trigger>

						<Tabs.Trigger value="hour">
							Time
						</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
			</Flex>

			<Box
				bg="bg.canvas"
				borderWidth="1px"
				borderColor="border.default"
				borderRadius="md"
				overflowX="auto"
			>
				<Table.Root size="sm" variant="line">
					<Table.Header>
						<Table.Row>
							<Table.ColumnHeader>
								Period
							</Table.ColumnHeader>

							<Table.ColumnHeader textAlign="end">
								Trades
							</Table.ColumnHeader>

							<Table.ColumnHeader textAlign="end">
								Win rate
							</Table.ColumnHeader>

							<Table.ColumnHeader textAlign="end">
								PnL
							</Table.ColumnHeader>

							<Table.ColumnHeader textAlign="end">
								Avg PnL
							</Table.ColumnHeader>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{rows.map((row) => (
							<Table.Row key={row.key}>
								<Table.Cell fontWeight="medium">
									{row.label}
								</Table.Cell>

								<Table.Cell textAlign="end">
									{fmtInt(row.trades)}
								</Table.Cell>

								<Table.Cell textAlign="end">
									{fmtPercent(row.winRate)}
								</Table.Cell>

								<Table.Cell textAlign="end">
									<Badge variant="subtle">
										{fmtSigned(row.totalPnl)}
									</Badge>
								</Table.Cell>

								<Table.Cell textAlign="end">
									{fmtSigned(row.averagePnl)}
								</Table.Cell>
							</Table.Row>
						))}
					</Table.Body>
				</Table.Root>
			</Box>
		</Box>
	);
}

function TradeLinks({
	tradeIds,
	tradesById,
}: {
	tradeIds: number[];
	tradesById: Map<number, TradeScoringData>;
}) {
	return (
		<Box>
			<Heading size="sm" mb={3}>
				Trades ({tradeIds.length})
			</Heading>

			<Wrap>
			{tradeIds.map((id) => {
				const trade = tradesById.get(id);
				return (
					<WrapItem key={id}>
						<RouterLink
							to={`/trades/${id}`}
							target="_blank"
						>
							<Badge
								variant="outline"
								cursor="pointer"
								px={2}
								py={1}
							>
								<HStack gap={2}>
									<Text>#{id}</Text>

									{trade && (
									<>
										<Text>
											{new Date(trade.date).toLocaleDateString()}
										</Text>

										<Text>
											{trade.pnl >= 0 ? "+" : ""}
											{trade.pnl.toFixed(2)}
										</Text>
									</>
									)}

									<ExternalLink size={11} />
								</HStack>
							</Badge>
						</RouterLink>
					</WrapItem>
				);
			})}
			</Wrap>
		</Box>
	);
}

function ComparisonTable({
	entries,
	original,
	getName,
	tradesById,
}: {
	entries: ComparisonEntry[];
	original: ComparisonEntry;
	getName: (id: number) => string;
	tradesById: Map<number, TradeScoringData>;
}) {
	const [expanded, setExpanded] =
		useState<number | null>(null);

	if (!entries.length) {
		return (
			<Box py={10} textAlign="center">
				<Text opacity={0.6}>
					No combinations in this category.
				</Text>
			</Box>
		);
	}

	return (
		<Box
			bg="bg.canvas"
			borderWidth="1px"
			borderColor="border.default"
			borderRadius="md"
			overflowX="auto"
		>
			<Table.Root size="sm" variant="line">
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeader>
							Combination
						</Table.ColumnHeader>

						<Table.ColumnHeader textAlign="end">
							Support
						</Table.ColumnHeader>

						<Table.ColumnHeader textAlign="end">
							Win rate
						</Table.ColumnHeader>

						<Table.ColumnHeader textAlign="end">
							Avg risk
						</Table.ColumnHeader>

						<Table.ColumnHeader textAlign="end">
							Total PnL
						</Table.ColumnHeader>

						<Table.ColumnHeader textAlign="end">
							PF
						</Table.ColumnHeader>

						<Table.ColumnHeader textAlign="end">
							μIn
						</Table.ColumnHeader>

						<Table.ColumnHeader textAlign="end">
							Trades
						</Table.ColumnHeader>

						<Table.ColumnHeader w="40px" />
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{entries.map((entry, index) => {
						const isExpanded = expanded === index;

						return (
							<ComparisonTableEntry
								key={index}
								entry={entry}
								original={original}
								getName={getName}
								tradesById={tradesById}
								isExpanded={isExpanded}
								onToggle={() =>
									setExpanded(
										isExpanded
											? null
											: index,
									)
								}
							/>
						);
					})}
				</Table.Body>
			</Table.Root>
		</Box>
	);
}

function ComparisonTableEntry({
	entry,
	original,
	getName,
	tradesById,
	isExpanded,
	onToggle,
}: {
	entry: ComparisonEntry;
	original: ComparisonEntry;
	getName: (id: number) => string;
	tradesById: Map<number, TradeScoringData>;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	const pfDelta =
		entry.profitFactor != null &&
		original.profitFactor != null
			? entry.profitFactor - original.profitFactor
			: null;

	const muDelta =
		entry.muIn != null && original.muIn != null
			? entry.muIn - original.muIn
			: null;

	return (
		<>
			<Table.Row
				cursor="pointer"
				onClick={onToggle}
				_hover={{ bg: "bg.subtle" }}
			>
				<Table.Cell minW="260px">
					<LabelCombination
						entry={entry}
						getName={getName}
					/>
				</Table.Cell>

				<MetricCell
					value={fmtInt(entry.support)}
					delta={
						entry.support - original.support
					}
					neutral
				/>

				<MetricCell
					value={fmtPercent(entry.winRate)}
					delta={
						entry.winRate - original.winRate
					}
					percent
				/>

				<MetricCell
					value={fmt(entry.averageRisk)}
					delta={
						entry.averageRisk -
						original.averageRisk
					}
				/>

				<MetricCell
					value={fmtSigned(entry.totalPnl)}
					delta={
						entry.totalPnl -
						original.totalPnl
					}
				/>

				<Table.Cell textAlign="end">
					<Text>{fmtPf(entry.profitFactor)}</Text>

					{pfDelta != null ? (
						<Delta value={pfDelta} />
					) : (
						<Text fontSize="xs" opacity={0.5}>
							—
						</Text>
					)}
				</Table.Cell>

				<Table.Cell textAlign="end">
					<Text>
						{entry.muIn != null
							? fmt(entry.muIn)
							: "—"}
					</Text>

					{muDelta != null ? (
						<Delta value={muDelta} />
					) : (
						<Text fontSize="xs" opacity={0.5}>
							—
						</Text>
					)}
				</Table.Cell>

				<Table.Cell textAlign="end">
					{fmtInt(entry.tradeIds.length)}
				</Table.Cell>

				<Table.Cell textAlign="end">
					{isExpanded ? (
						<ChevronUp size={16} />
					) : (
						<ChevronDown size={16} />
					)}
				</Table.Cell>
			</Table.Row>

			{isExpanded && (
				<Table.Row>
					<Table.Cell
						colSpan={9}
						bg="bg.surface"
						p={5}
					>
						<Flex direction="column" gap={6}>
							<Box>
								<Heading size="xs" mb={3}>
									Combination
								</Heading>

								<LabelCombination
									entry={entry}
									getName={getName}
								/>
							</Box>

							<SeasonalityTable
								tradeIds={entry.tradeIds}
								tradesById={tradesById}
							/>

							<TradeLinks
								tradeIds={entry.tradeIds}
								tradesById={tradesById}
							/>
						</Flex>
					</Table.Cell>
				</Table.Row>
			)}
		</>
	);
}

function MetricCell({
	value,
	delta,
	percent = false,
	neutral = false,
}: {
	value: string;
	delta: number;
	percent?: boolean;
	neutral?: boolean;
}) {
	return (
		<Table.Cell textAlign="end">
			<Text>{value}</Text>

			<Delta
				value={delta}
				percent={percent}
				neutral={neutral}
			/>
		</Table.Cell>
	);
}

export default function Comparison() {
	const {
		labels,
		loadingLabels,
		reloadLabels,
	} = useFetchLabels();

	const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
	const [labelsOpen, setLabelsOpen] = useState(false);

	const [report, setReport] = useState<ComparisonReport | null>(null);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [comparisonType, setComparisonType] =
		useState<ComparisonType>("generalized");

	const labelsById = useMemo(
		() =>
			new Map(
				labels.map((label) => [
					label.id,
					label.name,
				]),
			),
		[labels],
	);

	const getName = useCallback(
		(id: number) => labelsById.get(id) ?? `#${id}`,
		[labelsById]
	);

	const tradesById = useMemo(
		() => new Map(
			Object.entries(report?.tradesObj ?? {})
				.map(([k, t]) => [Number(k), t])
		),
		[report],
	);

	const handleCompare = async () => {
		if (!selectedLabelIds.length) return;

		setLoading(true);
		setError(null);

		try {
			const result = await getComparison(selectedLabelIds);
			setReport(result);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to compare labels",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box
			p={{ base: 4, md: 8 }}
			bg="bg.canvas"
			minH="100vh"
		>
			<Flex
				direction="column"
				gap={6}
				maxW="1200px"
				mx="auto"
			>

				<Box>
					<Heading size="lg">
						Combination Comparison
					</Heading>

					<Text
						fontSize="sm"
						opacity={0.7}
						mt={1}
					>
						Select a label combination and compare
						related combinations against it.
					</Text>
				</Box>

				<Box
					bg="bg.surface"
					borderWidth="1px"
					borderColor="border.default"
					borderRadius="lg"
					p={4}
				>
					<Heading size="sm" mb={4}>
						Combination
					</Heading>

					<Flex
						gap={4}
						align="flex-end"
						wrap="wrap"
					>
						<Box flex="1" minW="300px">
							<SelectLabelButton
								selectedIds={selectedLabelIds}
								setLabelIds={setSelectedLabelIds}
								loading={loadingLabels}
								setOpen={setLabelsOpen}
								labels={labels}
								disabled={false}
							/>
						</Box>

						<Button
							onClick={handleCompare}
							loading={loading}
							disabled={
								loading ||
								selectedLabelIds.length === 0
							}
						>
							Compare
						</Button>
					</Flex>

					{selectedLabelIds.length > 0 && (
						<Text
							fontSize="xs"
							opacity={0.6}
							mt={3}
						>
							{selectedLabelIds.length} label
							{selectedLabelIds.length !== 1
								? "s"
								: ""}{" "}
							selected
						</Text>
					)}
				</Box>

				{error && (
					<Box
						bg="bg.surface"
						borderWidth="1px"
						borderColor="red.500"
						borderRadius="lg"
						p={4}
					>
						<Text color="red.400">
							{error}
						</Text>
					</Box>
				)}

				{!report && !loading && (
					<Box
						bg="bg.surface"
						borderWidth="1px"
						borderColor="border.default"
						borderRadius="lg"
						py={16}
						px={4}
						textAlign="center"
					>
						<Text
							fontSize="lg"
							fontWeight="medium"
						>
							Select a combination
						</Text>

						<Text
							fontSize="sm"
							opacity={0.6}
							mt={1}
						>
							Choose the labels above and click
							Compare.
						</Text>
					</Box>
				)}

				{report && (
					<>
						<OriginalSummary
							entry={report.original}
							getName={getName}
						/>

						<Box
							bg="bg.surface"
							borderWidth="1px"
							borderColor="border.default"
							borderRadius="lg"
							p={4}
						>
							<SeasonalityTable
								tradeIds={report.original.tradeIds}
								tradesById={tradesById}
							/>
						</Box>

						<Box
							bg="bg.surface"
							borderWidth="1px"
							borderColor="border.default"
							borderRadius="lg"
							p={4}
						>
							<TradeLinks
								tradeIds={report.original.tradeIds}
								tradesById={tradesById}
							/>
						</Box>

						<Box
							bg="bg.surface"
							borderWidth="1px"
							borderColor="border.default"
							borderRadius="lg"
							p={4}
						>
							<Flex
								justify="space-between"
								align="baseline"
								gap={4}
								wrap="wrap"
								mb={4}
							>
								<Box>
									<Heading size="sm">
										Comparisons
									</Heading>

									<Text
										fontSize="sm"
										opacity={0.65}
										mt={1}
									>
										Changes are relative to
										the original combination.
									</Text>
								</Box>
							</Flex>

							<Tabs.Root
								value={comparisonType}
								onValueChange={(e) =>
									setComparisonType(
										e.value as ComparisonType,
									)
								}
								variant="enclosed"
							>
								<Tabs.List>
									<Tabs.Trigger value="generalized">
										Generalized
										<CountBadge
											count={
												report.generalized
													.length
											}
										/>
									</Tabs.Trigger>

									<Tabs.Trigger value="exclusion">
										Exclusion
										<CountBadge
											count={
												report.exclusion
													.length
											}
										/>
									</Tabs.Trigger>

									<Tabs.Trigger value="replacement">
										Replacement
										<CountBadge
											count={
												report.replacement
													.length
											}
										/>
									</Tabs.Trigger>

									<Tabs.Trigger value="insertion">
										Insertion
										<CountBadge
											count={
												report.insertion
													.length
											}
										/>
									</Tabs.Trigger>
								</Tabs.List>

								<Tabs.Content
									value="generalized"
									pt={4}
								>
									<ComparisonTable
										entries={
											report.generalized
										}
										original={
											report.original
										}
										getName={getName}
										tradesById={
											tradesById
										}
									/>
								</Tabs.Content>

								<Tabs.Content
									value="exclusion"
									pt={4}
								>
									<ComparisonTable
										entries={
											report.exclusion
										}
										original={
											report.original
										}
										getName={getName}
										tradesById={
											tradesById
										}
									/>
								</Tabs.Content>

								<Tabs.Content
									value="replacement"
									pt={4}
								>
									<ComparisonTable
										entries={
											report.replacement
										}
										original={
											report.original
										}
										getName={getName}
										tradesById={
											tradesById
										}
									/>
								</Tabs.Content>

								<Tabs.Content
									value="insertion"
									pt={4}
								>
									<ComparisonTable
										entries={
											report.insertion
										}
										original={
											report.original
										}
										getName={getName}
										tradesById={
											tradesById
										}
									/>
								</Tabs.Content>
							</Tabs.Root>
						</Box>
					</>
				)}
			</Flex>

			<SelectLabels
				selectedIds={selectedLabelIds}
				setSelectedIds={setSelectedLabelIds}
				labels={labels}
				open={labelsOpen}
				setOpen={setLabelsOpen}
				reloadLabels={reloadLabels}
			/>
		</Box>
	);
}

function CountBadge({ count }: { count: number }) {
	return (
		<Badge
			ml={2}
			size="sm"
			variant="subtle"
			borderRadius="full"
		>
			{count}
		</Badge>
	);
}