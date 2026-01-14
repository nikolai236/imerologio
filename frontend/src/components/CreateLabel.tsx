import {
	Button,
	Input,
	Stack,
	Text,
	HStack,
	useDisclosure,
	DialogRoot,
	DialogBackdrop,
	DialogPositioner,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogBody,
	DialogFooter,
} from "@chakra-ui/react";
import { useState } from "react";
import type { Label } from "../../../shared/trades.types";
import PlusButton from "./PlusButton";


type Props = {
	onCreate: (label: Label) => Promise<void>;
	disabled?: boolean;
};

export default function CreateLabel({
	onCreate,
	disabled=false,
}: Props) {
	const { open, onOpen, onClose, setOpen } = useDisclosure();

	const [name,      setName]    = useState("");
	const [error,     setError]   = useState<string | null>(null);
	const [isLoading, setLoading] = useState(false);

	const resetForm = () => {
		setName('');
		setError(null);
		setLoading(false);
	};

	const handleClose = () => {
		onClose();
		resetForm();
	};

	const handleCreate = async () => {
		const trimmed = name.trim();

		setLoading(true);
		setError(null);

		try {

			await onCreate({ name: trimmed, tradeIds: [] });
			setLoading(false);
			setOpen(false);

		} catch (err: unknown) {

			const known = err as Error;
			setLoading(false);
			setError(known.message);

		}
	};


	return (
		<>
			<PlusButton onClick={onOpen} disabled={disabled} />

			<DialogRoot
				open={open}
				onOpenChange={(e) => {
					if (!e.open) handleClose();
				}}
			>
				<DialogBackdrop />
				<DialogPositioner>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create symbol</DialogTitle>
						</DialogHeader>

						<DialogBody>
							<Stack gap={4}>
								{error ? <Text color="red.400">{error}</Text> : null}

								<Input
									placeholder="Symbol name (e.g. NDXm)"
									value={name}
									onChange={(e) => {
										setName(e.target.value);
										if (error) setError(null);
									}}
									autoFocus
								/>

							</Stack>
						</DialogBody>

						<DialogFooter>
							<HStack>
								<Button variant="outline" onClick={handleClose} disabled={isLoading}>
									Cancel
								</Button>
								<Button onClick={handleCreate} loading={isLoading} colorScheme="teal">
									Create
								</Button>
							</HStack>
						</DialogFooter>
					</DialogContent>
				</DialogPositioner>
			</DialogRoot>
		</>
	);
}