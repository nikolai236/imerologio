import { useParams } from "react-router-dom";
import JournalContextProvider from "./JournalContextProvider";
import JournalEntryPage from "./JournalEntryPage";

export default function JournalEntryPageOuter() {
    const { id } = useParams();
    const numId = id !== "" ? Number(id) : undefined;

    return (
        <JournalContextProvider entryId={numId}>
            <JournalEntryPage />
        </JournalContextProvider>
    );
}