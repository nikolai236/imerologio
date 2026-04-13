import React, { useCallback, useEffect, useMemo, useState } from "react"

const stringify = (variable: any) => {
	if (typeof variable === "number" && variable % 1 !== 0) {
		return variable.toFixed(3);
	}
	return `${variable}`;
};

const useDraft = <T>(variable: T): [string, React.Dispatch<React.SetStateAction<string>>] => {
	const [draft, setDraft] = useState(stringify(variable));

	useEffect(
		() => setDraft(stringify(variable)),
		[variable]
	);

	return [draft, setDraft] as const;
};

export default useDraft;

export type Price = number | null;

const PRICE_RE = /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/;
const isValidPriceDraft = (s: string) => s === "" || PRICE_RE.test(s);

export const usePriceDraft = (price: Price, save: (price: Price) => void) => {
	const sanitized = useMemo(() =>
		price == null ? "" : stringify(price),
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
		if (isValidPriceDraft(trimmed.split(".")[0])) {
			toSave = Number(trimmed.replaceAll(",", ""));
		}

		save(toSave);
	}, [save, draft]);

	return { draft, setDraft, saveDraft } as const;
};