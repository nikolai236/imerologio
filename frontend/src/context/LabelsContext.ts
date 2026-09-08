import { createContext } from "react";
import type useLabels from "../hooks/useLabels";

type ContextType = ReturnType<typeof useLabels>;

const LabelsContext = createContext<ContextType | null>(null);
export default LabelsContext;