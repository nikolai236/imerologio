import CreateJournalEntryPage from "./CreateJournalEntryPage";
import JournalContextProvider from "./JournalContextProvider";

export default function CreateJournalEntryPageOuter() {
    return (
        <JournalContextProvider>
            <CreateJournalEntryPage />
        </JournalContextProvider>
    );
}