import {
	Button,
	Input,
	Stack,
	Text,
	NativeSelect,
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

import type { Symbol, SymbolEnum } from "../../../shared/trades.types";
import PlusButton from "./PlusButton";

type Props = {
	onCreate: (symbol: Symbol) => Promise<void>;
	defaultType?: SymbolEnum;
	disabled?: boolean;
};

export default function CreateSymbolPage({
	onCreate,
	defaultType="Futures",
	disabled=false,
}: Props) {
	const { open, onOpen, onClose, setOpen } = useDisclosure();

	const [name,      setName]    = useState("");
	const [type,      setType]    = useState<SymbolEnum>(defaultType);
	const [error,     setError]   = useState<string | null>(null);
	const [isLoading, setLoading] = useState(false);

	const resetForm = () => {
		setName('');
		setType(defaultType);
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

			await onCreate({ name: trimmed, type });
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

								<NativeSelect.Root>
									<NativeSelect.Field
										value={type}
										onChange={(e) => setType(e.currentTarget.value as SymbolEnum)}
									>
										<option value="Futures">Futures</option>
										<option value="CFD">CFD</option>
									</NativeSelect.Field>
									<NativeSelect.Indicator />
								</NativeSelect.Root>
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