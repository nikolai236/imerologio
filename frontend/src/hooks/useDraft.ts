import React, { useEffect, useState } from "react"
import { sanitizePrice } from "../lib/prices";

const useDraft = <T>(
	variable: T,
	sanitize?: (v: T) => string,
): [string, React.Dispatch<React.SetStateAction<string>>] => {

	sanitize ??= (v: T) => `${v}`;
	const [draft, setDraft] = useState(sanitize(variable));

	useEffect(
		() => setDraft(sanitize(variable)),
		[variable]
	);

	return [draft, setDraft];
};

export default useDraft;

export const usePriceDraft = <T>(price: T) =>
	useDraft(price, sanitizePrice);