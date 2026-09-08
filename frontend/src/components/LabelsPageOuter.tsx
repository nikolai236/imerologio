import LabelsContextProvider from "./LabelsContextProvider";
import LabelsPage from "./LabelsPage";

export default function LabelsPageOuter() {
	return (
		<LabelsContextProvider>
			<LabelsPage />
		</LabelsContextProvider>
	);
}