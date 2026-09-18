import {
	Box,
	Flex,
	HStack,
	Button,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
	const [scoringOpen, setScoringOpen] = useState(false);

	return (
		<Box bg="gray.800" px={6} py={4} color="white">
			<Flex align="center" justify="space-between">
				<Text fontSize="lg" fontWeight="bold">
					Imerologio
				</Text>

				<HStack gap={4}>
					<Link to="/">
						<Button
							variant="plain"
							color="white"
							_hover={{ bg: "whiteAlpha.200" }}
						>
							Home
						</Button>
					</Link>

					<Link to="/trades">
						<Button
							variant="plain"
							color="white"
							_hover={{ bg: "whiteAlpha.200" }}
						>
							Trades
						</Button>
					</Link>

					<Link to="/journal">
						<Button
							variant="plain"
							color="white"
							_hover={{ bg: "whiteAlpha.200" }}
						>
							Journal
						</Button>
					</Link>

					<Link to="/symbols">
						<Button
							variant="plain"
							color="white"
							_hover={{ bg: "whiteAlpha.200" }}
						>
							Symbols
						</Button>
					</Link>

					<Link to="/labels">
						<Button
							variant="plain"
							color="white"
							_hover={{ bg: "whiteAlpha.200" }}
						>
							Labels
						</Button>
					</Link>

					<Box
						position="relative"
						onMouseEnter={() => setScoringOpen(true)}
						onMouseLeave={() => setScoringOpen(false)}
					>
						<Button
							variant="plain"
							color="white"
							_hover={{ bg: "whiteAlpha.200" }}
						>
							Analytics
						</Button>

						{scoringOpen && (
							<Box
								position="absolute"
								top="100%"
								left={0}
								pt={2}
								zIndex={1000}
							>
								<VStack
									align="stretch"
									gap={1}
									bg="gray.700"
									p={2}
									borderRadius="md"
									boxShadow="lg"
									minW="160px"
								>
									<Link to="/analytics/scoring">
										<Button
											w="100%"
											variant="plain"
											color="white"
											justifyContent="flex-start"
											_hover={{
												bg: "whiteAlpha.200",
											}}
										>
											Scoring
										</Button>
									</Link>

									<Link to="/analytics/comparison">
										<Button
											w="100%"
											variant="plain"
											color="white"
											justifyContent="flex-start"
											_hover={{
												bg: "whiteAlpha.200",
											}}
										>
											Comparison
										</Button>
									</Link>
								</VStack>
							</Box>
						)}
					</Box>
				</HStack>
			</Flex>
		</Box>
	);
}
