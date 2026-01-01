import React, { useEffect, useState } from "react"

const useDraft = (variable: any): [string, React.Dispatch<React.SetStateAction<string>>] => {
	const [draft, setDraft] = useState(`${variable}`);

	useEffect(() => setDraft(draft), [draft]);

	return [draft, setDraft];
};

export default useDraft;