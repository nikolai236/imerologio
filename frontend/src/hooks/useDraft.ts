import React, { useCallback, useEffect, useMemo, useState } from "react"

const useDraft = <T>(variable: T): [string, React.Dispatch<React.SetStateAction<string>>] => {
	const [draft, setDraft] = useState(`${variable}`);

	useEffect(
		() => setDraft(`${variable}`),
		[variable]
	);

	return [draft, setDraft] as const;
};

export default useDraft;

type Price = number | null;

const PRICE_RE = /^\d{1,3}(?:,\d{3})*$|^\d+$/;
const isValidPriceDraft = (s: string) => s === "" || PRICE_RE.test(s);

export const usePriceDraft = (price: Price, save: (price: Price) => void) => {
	const sanitized = useMemo(() =>
		price == null ? "" : String(price),
	[price]);

	const [draft, setDraft] = useState(sanitized);

	useEffect(() =>
		setDraft(sanitized), [sanitized]
	);

	const saveDraft = useCallback(() => {
		const trimmed = draft.trim();
		if (trimmed == "") {
			return save(null);
		}

		let toSave: Price = NaN;
		if (isValidPriceDraft(trimmed)) {
			toSave = Number(trimmed.replaceAll(",", ""));
		}

		save(toSave);
	}, [save, draft]);

	return { draft, setDraft, saveDraft } as const;
};