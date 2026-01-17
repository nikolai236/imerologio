import { Field, Input } from "@chakra-ui/react";
import { useMemo, useRef, } from "react";
import useDraft from "../hooks/useDraft";
import { dateStrToEpochMs, epochToDateStrInTZ } from "../lib/timezones";

type Props = {
	label?: string;
	epoch?: number;

	disabled?: boolean;
	invalid?: boolean;

	onChangeEpoch: (ms: number | null) => void;
};

export default function DatePicker({
	label = "Date / Time (ET)",
	epoch,

	disabled,
	invalid,

	onChangeEpoch,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);

	const parsedEpoch = useMemo(
		() => epochToDateStrInTZ(epoch), [epoch]
	);

	const [draft, setDraft] = useDraft(parsedEpoch);


	const commit = (v: string) => {
		const newEpoch = dateStrToEpochMs(v);
		onChangeEpoch(newEpoch);
		setDraft(epochToDateStrInTZ(epoch));
	};

	return (
		<Field.Root disabled={disabled} invalid={invalid}>
			<Field.Label>{label}</Field.Label>

		<Input
			ref={inputRef}
			type="text"
			value={draft}
			step={60}
			onChange={(e) => setDraft(e.target.value)}
			onBlur={() => {
				commit(draft);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter") (e.target as HTMLInputElement).blur();
				if (e.key === "Escape") {
					setDraft(epochToDateStrInTZ(epoch));
					(e.target as HTMLInputElement).blur();
				}
			}}
		/>

		{invalid && <Field.ErrorText>Invalid date</Field.ErrorText>}
		</Field.Root>
	);
}
