import { useContext } from "react";
import LabelsContext from "../context/LabelsContext";

const useLabelsContext = () => {
	const context = useContext(LabelsContext);
	if (context == null) {
		throw new Error("LabelsContext is empty");
	}

	return context;
};

export default useLabelsContext;