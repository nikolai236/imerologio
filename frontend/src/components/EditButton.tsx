import { IconButton } from "@chakra-ui/react";

type Props = {
	visible: boolean;
	onClick: () => void;
}

export default function EditButton({
	visible: disabled,
	onClick
}: Props) {
	if (!disabled) return null;
	return (
		<IconButton
			aria-label="Edit charts"
			variant="outline"
			onClick={onClick}
		>
			✎
		</IconButton>
	);
}