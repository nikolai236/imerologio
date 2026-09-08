import type { ReactNode } from "react";
import LabelsContext from "../context/LabelsContext";
import useLabels from "../hooks/useLabels";

type Props = {
	children: ReactNode;
};

export default function LabelsContextProvider({
	children,
}: Props) {
	const value = useLabels();
	return (
		<LabelsContext.Provider value={value}>
			{children}
		</LabelsContext.Provider>
	);
}