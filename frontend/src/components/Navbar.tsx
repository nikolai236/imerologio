// components/Navbar.tsx
import { Box, Flex, HStack, Button, Text } from "@chakra-ui/react";
import { Link, } from "react-router-dom";

export default function Navbar() {
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
							colorScheme="whiteAlpha"
							color="white"
							_hover={{ bg: "whiteAlpha.200" }}
						> Home
						</Button>
					</Link>

					<Link to="/trades">
						<Button
							variant="plain"
							colorScheme="whiteAlpha"
							color="white"
							_hover={{ bg: "whiteAlpha.200" }}
						> Trades
						</Button>
					</Link>

					<Link to="/symbols">
						<Button
							variant="plain"
							colorScheme="whiteAlpha"
							color="white"
							_hover={{ bg: "whiteAlpha.200" }}
						> Symbols
						</Button>
					</Link>

					<Link to="/labels">
						<Button
							variant="plain"
							colorScheme="whiteAlpha"
							color="white"
							_hover={{ bg: "whiteAlpha.200" }}
						> Labels
						</Button>
					</Link>

				</HStack>
			</Flex>
		</Box>
	);
}
