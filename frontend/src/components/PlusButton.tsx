import { Plus } from "lucide-react";
import { Button } from "@chakra-ui/react";

type Props = {
	onClick: () => void;
	disabled?: boolean
};

export default function PlusButton({
	onClick,
	disabled=false,
}: Props) {
	return (
		<Button
			position="fixed"
			right="24px"
			bottom="24px"
			w="56px"
			h="56px"
			borderRadius="full"
			fontSize="28px"
			lineHeight="1"
			colorScheme="teal"
			onClick={onClick}
			disabled={disabled}
			aria-label="Create symbol"
		>
			<Plus size={50} />
		</Button>
	);
}