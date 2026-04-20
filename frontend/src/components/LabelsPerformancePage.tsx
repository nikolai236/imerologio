import {
	Badge,
	Box,
	Card,
	Flex,
	Grid,
	GridItem,
	Heading,
	HStack,
	NativeSelect,
	SimpleGrid,
	Spinner,
	Stat,
	Table,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import {
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import type { PerformanceReport } from "../../../shared/trades.types";

import useFetchLabels from "../hooks/useFetchLabels";
import { getPerformance } from "../api/labels";

const formatPercent = (value: number | null | undefined) => {
	if (value == null || Number.isNaN(value)) return "—";
	return `${(value * 100).toFixed(1)}%`;
};

const formatNumber = (value: number | null | undefined, digits = 2) => {
	if (value == null || Number.isNaN(value)) return "—";
	return value.toFixed(digits);
};

const formatDate = (date: Date | null) => {
	if (!date) return "—";

	return date.toLocaleString("en-US", {
		timeZone: "America/New_York",
		year: "2-digit",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
};

const goToTrade = (id: number) => {
	window.open(`/trades/${id}`, "_blank", "noopener,noreferrer");
};

export default function LabelsPerformancePage() {
	const { labels, loadingLabels } = useFetchLabels(false);

	const [includeIds, setIncludeIds] = useState<number[]>([]);
	const [excludeIds, setExcludeIds] = useState<number[]>([]);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [report, setReport] = useState<PerformanceReport | null>(null);

	const includeSet = useMemo(() => new Set(includeIds), [includeIds]);
	const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

	const filteredLabels = useMemo(
		() => labels.filter(label => !label.name.startsWith("symbol:")),
		[labels]
	);

	const includeOptions = useMemo(
		() => filteredLabels.filter(label => !excludeSet.has(label.id)),
		[filteredLabels, excludeSet]
	);

	const excludeOptions = useMemo(
		() => filteredLabels.filter(label => !includeSet.has(label.id)),
		[filteredLabels, includeSet]
	);

	const selectedIncludeLabels = useMemo(
		() => filteredLabels.filter(label => includeSet.has(label.id)),
		[filteredLabels, includeSet]
	);

	const selectedExcludeLabels = useMemo(
		() => filteredLabels.filter(label => excludeSet.has(label.id)),
		[filteredLabels, excludeSet]
	);

	const trades = useMemo(() => {
		if (!report) return [];

		return report.trades
			.map(trade => ({
				...trade,
				firstOrderDate: trade.orders[0].date,
				derivedPnl: trade.pnl!,
			}))
			.sort((a, b) => {
				const aTime = a.firstOrderDate ? +a.firstOrderDate : 0;
				const bTime = b.firstOrderDate ? +b.firstOrderDate : 0;
				return aTime - bTime;
			});
	}, [report]);

	const stats = useMemo(() => {
		const tradeCount = trades.length;

		let grossProfit = 0;
		let grossLoss = 0;
		let wins = 0;

		for (const trade of trades) {
			if (trade.derivedPnl >= 0) {
				grossProfit += trade.derivedPnl;
				wins++;
			} else {
				grossLoss += Math.abs(trade.derivedPnl);
			}
		}

		const netPnl = grossProfit - grossLoss;
		const avgPnl = tradeCount ? netPnl / tradeCount : null;
		const losses = tradeCount - wins;
		const avgWin = wins ? grossProfit / wins : null;
		const avgLoss = losses ? grossLoss / losses : null;

		return {
			tradeCount,
			grossProfit,
			grossLoss,
			netPnl,
			avgPnl,
			avgWin,
			avgLoss,
		};
	}, [trades]);

	const equityData = useMemo(() => {
		let running = 0;

		return trades.map(trade => {
			running += trade.derivedPnl;

			return {
				id: trade.id,
				date: formatDate(new Date(trade.firstOrderDate)),
				pnl: trade.derivedPnl,
				equity: running,
			};
		});
	}, [trades]);

	const handleAddInclude = (value: string) => {
		const id = Number(value);
		if (!id || includeSet.has(id) || excludeSet.has(id)) return;
		setIncludeIds(prev => [...prev, id]);
	};

	const handleAddExclude = (value: string) => {
		const id = Number(value);
		if (!id || excludeSet.has(id) || includeSet.has(id)) return;
		setExcludeIds(prev => [...prev, id]);
	};

	const applyLabels = async () => {
		setLoading(true);
		setError(null);

		try {
			const data = await getPerformance(includeIds, excludeIds);
			setReport(data);
		} catch (err) {
			console.error(err);
			setError("Failed to load performance.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		applyLabels()
	}, [includeIds, excludeIds]);

	return (
		<Box p={6}>
			<VStack align="stretch" gap={6}>
				<Flex justify="space-between" align="center" wrap="wrap" gap={4}>
					<Box>
						<Heading size="lg">Label Performance</Heading>
						<Text color="fg.muted">
							Test performance for included and excluded labels.
						</Text>
					</Box>
				</Flex>

				<Card.Root>
					<Card.Body>
						<Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
							<GridItem>
								<VStack align="stretch" gap={3}>
									<Text fontWeight="semibold">Include labels</Text>

									<NativeSelect.Root disabled={loadingLabels}>
										<NativeSelect.Field
											defaultValue=""
											onChange={e => {
												handleAddInclude(e.target.value);
												e.currentTarget.value = "";
											}}
										>
											<option value="">Select label</option>
											{includeOptions.map(label => (
												<option key={label.id} value={label.id}>
													{label.name}
												</option>
											))}
										</NativeSelect.Field>
										<NativeSelect.Indicator />
									</NativeSelect.Root>

									<HStack wrap="wrap" gap={2}>
										{selectedIncludeLabels.map(label => (
											<Badge
												key={label.id}
												colorPalette="green"
												px={2}
												py={1}
												borderRadius="md"
												cursor="pointer"
												onClick={() => {
													setIncludeIds(prev => prev.filter(id => id !== label.id))
												}}
											>
												{label.name} ×
											</Badge>
										))}
									</HStack>
								</VStack>
							</GridItem>

							<GridItem>
								<VStack align="stretch" gap={3}>
									<Text fontWeight="semibold">Exclude labels</Text>

									<NativeSelect.Root disabled={loadingLabels}>
										<NativeSelect.Field
											defaultValue=""
											onChange={e => {
												handleAddExclude(e.target.value);
												e.currentTarget.value = "";
											}}
										>
											<option value="">Select label</option>
											{excludeOptions.map(label => (
												<option key={label.id} value={label.id}>
													{label.name}
												</option>
											))}
										</NativeSelect.Field>
										<NativeSelect.Indicator />
									</NativeSelect.Root>

									<HStack wrap="wrap" gap={2}>
										{selectedExcludeLabels.map(label => (
											<Badge
												key={label.id}
												colorPalette="red"
												px={2}
												py={1}
												borderRadius="md"
												cursor="pointer"
												onClick={() => {
													setExcludeIds(prev => prev.filter(id => id !== label.id))
												}}
											>
												{label.name} ×
											</Badge>
										))}
									</HStack>
								</VStack>
							</GridItem>
						</Grid>
					</Card.Body>
				</Card.Root>

				{error && (
					<Box color="fg.error" fontWeight="medium">
						{error}
					</Box>
				)}

				{loading && (
					<Flex justify="center" py={12}>
						<Spinner size="lg" />
					</Flex>
				)}

				{!loading && report && (
					<>
						<SimpleGrid columns={{ base: 1, md: 2, xl: 6 }} gap={4}>
							<Card.Root>
								<Card.Body>
									<Stat.Root>
										<Stat.Label>Profit Factor</Stat.Label>
										<Stat.ValueText>
											{formatNumber(report.profitFactor)}
										</Stat.ValueText>
									</Stat.Root>
								</Card.Body>
							</Card.Root>

							<Card.Root>
								<Card.Body>
									<Stat.Root>
										<Stat.Label>Win Rate</Stat.Label>
										<Stat.ValueText>
											{formatPercent(report.winRate)}
										</Stat.ValueText>
									</Stat.Root>
								</Card.Body>
							</Card.Root>

							<Card.Root>
								<Card.Body>
									<Stat.Root>
										<Stat.Label>Trades</Stat.Label>
										<Stat.ValueText>{stats.tradeCount}</Stat.ValueText>
									</Stat.Root>
								</Card.Body>
							</Card.Root>

							<Card.Root>
								<Card.Body>
									<Stat.Root>
										<Stat.Label>Net PnL</Stat.Label>
										<Stat.ValueText>{formatNumber(stats.netPnl)}</Stat.ValueText>
										<Stat.HelpText>
											Gross +{formatNumber(stats.grossProfit)} / -
											{formatNumber(stats.grossLoss)}
										</Stat.HelpText>
									</Stat.Root>
								</Card.Body>
							</Card.Root>

							<Card.Root>
								<Card.Body>
									<Stat.Root>
										<Stat.Label>Avg PnL</Stat.Label>
										<Stat.ValueText>{formatNumber(stats.avgPnl)}</Stat.ValueText>
									</Stat.Root>
								</Card.Body>
							</Card.Root>

							<Card.Root>
								<Card.Body>
									<Stat.Root>
										<Stat.Label>Avg Win / Loss</Stat.Label>
										<Stat.ValueText fontSize="lg">
											{formatNumber(stats.avgWin)} / {formatNumber(stats.avgLoss)}
										</Stat.ValueText>
									</Stat.Root>
								</Card.Body>
							</Card.Root>
						</SimpleGrid>

						<Grid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap={6}>
							<GridItem minW={0}>
								<Card.Root>
									<Card.Body>
										<VStack align="stretch" gap={4}>
											<Heading size="md">Cumulative PnL</Heading>

											<Box h="420px">
												<ResponsiveContainer width="100%" height="100%">
													<LineChart data={equityData}>
														<XAxis dataKey="date" minTickGap={24} />
														<YAxis />
														<Tooltip
															formatter={(value) => {
																if (typeof value !== "number") return "—";
																return formatNumber(value);
															}}
														/>
														<Line
															type="monotone"
															dataKey="equity"
															dot={false}
															strokeWidth={2}
														/>
													</LineChart>
												</ResponsiveContainer>
											</Box>
										</VStack>
									</Card.Body>
								</Card.Root>
							</GridItem>

							<GridItem minW={0}>
								<Card.Root>
									<Card.Body>
										<VStack align="stretch" gap={4}>
											<Heading size="md">Trades</Heading>

											<Box maxH="420px" overflowY="auto">
												<Table.Root size="sm" variant="line" interactive stickyHeader>
													<Table.Header>
														<Table.Row>
															<Table.ColumnHeader>ID</Table.ColumnHeader>
															<Table.ColumnHeader>Date</Table.ColumnHeader>
															<Table.ColumnHeader textAlign="end">
																PnL
															</Table.ColumnHeader>
														</Table.Row>
													</Table.Header>

													<Table.Body>
														{trades.map(trade => (
															<Table.Row key={trade.id} onClick={() => goToTrade(trade.id)}>
																<Table.Cell>{trade.id}</Table.Cell>
																<Table.Cell>
																	{formatDate(new Date(trade.firstOrderDate))}
																</Table.Cell>
																<Table.Cell textAlign="end">
																	<Text
																		color={
																			trade.derivedPnl >= 0
																				? "green.500"
																				: "red.500"
																		}
																		fontWeight="medium"
																	>
																		{formatNumber(trade.derivedPnl)}
																	</Text>
																</Table.Cell>
															</Table.Row>
														))}
													</Table.Body>
												</Table.Root>
											</Box>
										</VStack>
									</Card.Body>
								</Card.Root>
							</GridItem>
						</Grid>
					</>
				)}
			</VStack>
		</Box>
	);
}