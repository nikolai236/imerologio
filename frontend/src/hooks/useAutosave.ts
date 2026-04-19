import { useEffect, useRef } from "react";

const useAutosave = (
	save: (silent: boolean) => any,
	on=true,
) => {
	const saveRef = useRef(save);
	saveRef.current = save;

	useEffect(() => {
		if (on) return () => {
			void saveRef.current(true).catch();
		};
	}, [on]);
};

export default useAutosave;