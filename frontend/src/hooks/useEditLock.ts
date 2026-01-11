import { useState } from "react"

const useEditLock = <T extends string | number>() => {
	const [active, setActive] = useState<T | null>(null);

	const isActive = (key: T) => key == active;
	const lockAll = () => setActive(null);

	return {
		isActive,
		setActive: (key: T) => () => setActive(key),
		lockAll,
	};
};

export default useEditLock;