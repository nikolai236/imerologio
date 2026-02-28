import {
	Box,
	Flex,
	Heading,
	Text,
	Input,
	HStack,
	Badge,
	SimpleGrid,
	Stat,
	IconButton,
	Separator,
	Table,
	NativeSelect,
	Wrap,
	WrapItem,
	Tabs,
	Switch
} from "@chakra-ui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
} from "recharts";
import useScoring from "../hooks/useScoring";
import { useMemo } from "react";

const fmt = (x: number) =>
	new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(x);

const fmtInt = (x: number) =>
	new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(x);

type SortBy = "upliftPnl" | "upliftPerSupport" | "muIn" | "score" | "RR";

const ColoredBar = (props: any) => {
	const { x, y, width, height, value } = props;

	const h = Math.abs(height);
	const yy = height >= 0 ? y : y + height;

	const fill =
		value >= 0 ? "rgba(0, 155, 57, 0.5)" : "rgba(254, 64, 64, 0.5)";

	return (
		<rect
			x={x}
			y={yy}
			width={width}
			height={h}
			fill={fill}
			stroke="rgba(0,0,0,0.25)"
			strokeWidth={1}
			rx={2}
		/>
	);
};

export default function Scoring() {
	const {
		data,
		chartData,
		filtered,
		maxObservedK,
		query,
		minK,
		maxK,
		sortBy,
		sortDir,
		chartCount,
		filterBreakeven,
		beThresholdDraft,

		setFilterBreakeven,
		setBeThresholdDraft,
		saveBeThresholdDraft,
		getName,
		setSortBy,
		setSortDir,
		setQuery,
		setChartCount,
		setMinK,
		setMaxK,
	} = useScoring();

	const kOptions = useMemo(
		() =>
			Array.from(
				{ length: Math.max(1, maxObservedK) },
				(_, i) => i + 1
			),
		[maxObservedK]
	);

	const { xTickHeight, bottomMargin } = useMemo(() => {
		const maxLines = Math.max(
			1,
			...chartData.map((d) => String(d.name).split("\n").length)
		);
		const lineH = 7;
		const h = maxLines * lineH;
		return {
			xTickHeight: h,
			bottomMargin: h + 10,
		};
	}, [chartData]);

	const { chartWidthPx } = useMemo(() => {
		const BAR_PX = 200;
		const MIN_PX = 600;
		return {
			chartWidthPx: Math.max(MIN_PX, (chartData?.length ?? 0) * BAR_PX),
		};
	}, [chartData]);

	const toggleDir = () => setSortDir((d) => (d === "desc" ? "asc" : "desc"));

	return (
		<Box p={{ base: 4, md: 8 }} bg="bg.canvas" minH="100vh">
			<Flex direction="column" gap={6} maxW="1200px" mx="auto">
				<Box>
					<Heading size="lg">Label Scoring</Heading>
				</Box>

				<SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
					<Box
						bg="bg.surface"
						borderWidth="1px"
						borderColor="border.default"
						borderRadius="lg"
						p={4}
					>
						<Stat.Root>
							<Stat.Label>Trade count</Stat.Label>
							<Stat.ValueText>{fmtInt(data?.tradeCount ?? 0)}</Stat.ValueText>
							<Stat.HelpText>
								minSupport = {fmtInt(data?.minSupport ?? 0)}
							</Stat.HelpText>
						</Stat.Root>
					</Box>

					<Box
						bg="bg.surface"
						borderWidth="1px"
						borderColor="border.default"
						borderRadius="lg"
						p={4}
					>
						<Stat.Root>
							<Stat.Label>μall</Stat.Label>
							<Stat.ValueText>{fmt(data?.mean ?? 0)}</Stat.ValueText>
							<Stat.HelpText>per trade</Stat.HelpText>
						</Stat.Root>
					</Box>

					<Box
						bg="bg.surface"
						borderWidth="1px"
						borderColor="border.default"
						borderRadius="lg"
						p={4}
					>
						<Stat.Root>
							<Stat.Label>Average Risk to Reward</Stat.Label>
							<Stat.ValueText>{data?.RR != null ? fmt(data?.RR) : "∞"}</Stat.ValueText>
							<Stat.HelpText>
								max level depth = {fmtInt(Math.max(1, maxObservedK))}
							</Stat.HelpText>
						</Stat.Root>
					</Box>
				</SimpleGrid>

				<Box
					bg="bg.surface"
					borderWidth="1px"
					borderColor="border.default"
					borderRadius="lg"
					p={4}
				>
					<Heading size="sm" mb={3}>
						Controls
					</Heading>

					<Tabs.Root defaultValue="labels" variant="enclosed">
						<Tabs.List>
							<Tabs.Trigger value="labels">Labels & sorting</Tabs.Trigger>
							<Tabs.Trigger value="breakeven">Breakeven</Tabs.Trigger>
						</Tabs.List>

						<Tabs.Content value="labels">
							<Flex gap={3} wrap="wrap" align="center" pt={4}>
								<Box minW={{ base: "100%", md: "360px" }}>
									<Text fontSize="sm" mb={1} opacity={0.8}>
										Filter by labels (type ids like: <code>name1,name2</code>) — must
										be contained
									</Text>
									<Input
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										placeholder="e.g. name1,name2"
										bg="bg.canvas"
									/>
								</Box>

								<Box>
									<Text fontSize="sm" mb={1} opacity={0.8}>
										k interval
									</Text>
									<HStack>
										<NativeSelect.Root>
											<NativeSelect.Field
												value={String(minK)}
												onChange={(e) => setMinK(Number(e.target.value))}
												bg="bg.canvas"
											>
												{kOptions.map((k) => (
													<option key={k} value={k}>
														min {k}
													</option>
												))}
											</NativeSelect.Field>
										</NativeSelect.Root>

										<NativeSelect.Root>
											<NativeSelect.Field
												value={String(Math.min(maxK, Math.max(1, maxObservedK)))}
												onChange={(e) => setMaxK(Number(e.target.value))}
												bg="bg.canvas"
											>
												{kOptions.map((k) => (
													<option key={k} value={k}>
														max {k}
													</option>
												))}
											</NativeSelect.Field>
										</NativeSelect.Root>
									</HStack>
								</Box>

								<Box>
									<Text fontSize="sm" mb={1} opacity={0.8}>
										Sort
									</Text>
									<HStack>
										<NativeSelect.Root>
											<NativeSelect.Field
												value={sortBy}
												onChange={(e) => setSortBy(e.target.value as SortBy)}
												bg="bg.canvas"
											>
												<option value="upliftPerSupport">
													upliftPnl / support (normalized)
												</option>
												<option value="RR">RR</option>
												<option value="muIn">mean</option>
												<option value="score">score</option>
											</NativeSelect.Field>
										</NativeSelect.Root>

										<IconButton
											aria-label="Toggle sort direction"
											onClick={toggleDir}
											variant="outline"
										>
											{sortDir === "desc" ? (
												<ChevronDown size={18} />
											) : (
												<ChevronUp size={18} />
											)}
										</IconButton>
									</HStack>
								</Box>

								<Box>
									<Text fontSize="sm" mb={1} opacity={0.8}>
										Chart bars
									</Text>

									<NativeSelect.Root>
										<NativeSelect.Field
											value={String(chartCount)}
											onChange={(e) => setChartCount(Number(e.target.value))}
											bg="bg.canvas"
										>
											{[10, 25, 50, 100, 200].map((n) => (
												<option key={n} value={n}>
													top {n}
												</option>
											))}
										</NativeSelect.Field>
									</NativeSelect.Root>
								</Box>
							</Flex>
						</Tabs.Content>

						<Tabs.Content value="breakeven">
							<Flex gap={4} wrap="wrap" align="center" pt={4}>
								<HStack>
									<Switch.Root
										checked={filterBreakeven}
										onCheckedChange={(e) => setFilterBreakeven(!!e.checked)}
									>
										<Switch.HiddenInput />
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
									</Switch.Root>
									<Text fontSize="sm" opacity={0.85}>
										Filter out breakeven trades
									</Text>
								</HStack>

								<Box minW={{ base: "100%", md: "320px" }} opacity={filterBreakeven ? 1 : 0.5}>
									<Text fontSize="sm" mb={1} opacity={0.8}>
										Breakeven threshold (|PNL| ≤ threshold is breakeven)
									</Text>
									<Input
										value={beThresholdDraft}
										disabled={!filterBreakeven}
										onChange={(e) => setBeThresholdDraft(e.target.value)}
										onBlur={saveBeThresholdDraft}
										placeholder="0"
										bg="bg.canvas"
									/>
								</Box>
							</Flex>
						</Tabs.Content>
					</Tabs.Root>
				</Box>

				<Box
					bg="bg.surface"
					borderWidth="1px"
					borderColor="border.default"
					borderRadius="lg"
					p={4}
				>
					<Flex justify="space-between" align="baseline" mb={2} gap={4} wrap="wrap">
						<Heading size="sm">Top combinations chart</Heading>
						<Text fontSize="sm" opacity={0.75}>
							Bar ={" "}{sortBy}{" "}(sorted)
						</Text>
					</Flex>

					<Box
						overflowX="auto"
						overflowY="hidden"
						bg="bg.canvas"
						borderRadius="md"
						p={2}
						css={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "thin" }}
					>
						<Box
							width={`${chartWidthPx}px`}
							height={{ base: "280px", md: "360px" }}
						>
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={chartData}
									margin={{
										top: 10,
										right: 10,
										left: 10,
										bottom: bottomMargin,
									}}
								>
									<CartesianGrid strokeDasharray="3 3" />

									<XAxis
										dataKey="name"
										interval={0}
										height={xTickHeight}
										tick={({ x, y, payload }) => {
											const lines = String(payload.value).split("\n");
											return (
												<g transform={`translate(${x},${y})`}>
													<text textAnchor="middle" fontSize={12}>
														{lines.map((line, i) => (
															<tspan key={i} x={0} dy={i === 0 ? 10 : 14}>
																{line}
															</tspan>
														))}
													</text>
												</g>
											);
										}}
									/>

									<YAxis />

									<Tooltip
										cursor={{ fill: "rgba(0,0,0,0.05)" }}
										content={({ label, payload }) => {
											if (!payload || !payload.length) return null;
											return (
												<div style={{ whiteSpace: "pre-line" }}>
													<strong>{label}</strong>
													{payload.map((p) => (
														<div key={String(p.dataKey)}>
															{p.name == "sortRR" ?
																<>RR: {p.payload.RR != null ? fmt(p.value) : "∞"} </> :
																<>{p.name}: {fmt(p.value as number)}</>
															}
														</div>
													))}
												</div>
											);
										}}
									/>

									<Bar
										dataKey={sortBy == "RR" ? "sortRR" : sortBy}
										shape={<ColoredBar />}
									/>
								</BarChart>
							</ResponsiveContainer>
						</Box>
					</Box>

					<Separator my={4} />

					<Heading size="sm" mb={3}>
						All combinations table
					</Heading>

					<Box
						bg="bg.canvas"
						borderWidth="1px"
						borderColor="border.default"
						borderRadius="md"
					>
						<Table.Root size="sm" variant="line">
							<Table.Header>
								<Table.Row>
									<Table.ColumnHeader>labels</Table.ColumnHeader>
									<Table.ColumnHeader textAlign="end">support</Table.ColumnHeader>
									<Table.ColumnHeader textAlign="end">upliftPnl per trade</Table.ColumnHeader>
									<Table.ColumnHeader textAlign="end">mean PNL</Table.ColumnHeader>
									<Table.ColumnHeader textAlign="end">RR</Table.ColumnHeader>
									<Table.ColumnHeader textAlign="end">redundancy</Table.ColumnHeader>
									<Table.ColumnHeader textAlign="end">score</Table.ColumnHeader>
								</Table.Row>
							</Table.Header>

							<Table.Body>
								{filtered.map((r) => {
									const pos = r.upliftPnl >= 0;
									return (
										<Table.Row key={r.key}>
											<Table.Cell>
												<Wrap>
													{r.labelIds.map((id) => (
														<WrapItem key={id}>
															<Badge
																variant="subtle"
																borderRadius="full"
																px={2}
																py={0.5}
															>
																{getName(id)}
															</Badge>
														</WrapItem>
													))}
												</Wrap>
											</Table.Cell>

											<Table.Cell textAlign="end">{fmtInt(r.support)}</Table.Cell>

											<Table.Cell textAlign="end">
												<Badge variant={pos ? "solid" : "subtle"}>
													{pos ? "+" : ""}
													{fmt(r.upliftPerSupport)}
												</Badge>
											</Table.Cell>

											<Table.Cell textAlign="end">
												<Badge variant={data?.mean && r.muIn > data.mean ? "solid" : "subtle"}>
													{fmt(r.muIn)}
												</Badge>
											</Table.Cell>

											<Table.Cell textAlign="end">
												<Badge variant={(r.RR == null || data?.RR == null || r.RR > data.RR) ? "solid" : "subtle"}>
													{r.RR != null ? fmt(r.RR) : "∞"}
												</Badge>
											</Table.Cell>

											<Table.Cell textAlign="end">
												{r.redundancy != null ? fmt(r.redundancy) : "-"}
											</Table.Cell>

											<Table.Cell textAlign="end">
												{fmt(r.score)}
											</Table.Cell>
										</Table.Row>
									);
								})}
							</Table.Body>
						</Table.Root>
					</Box>
				</Box>
			</Flex>
		</Box>
	);
}