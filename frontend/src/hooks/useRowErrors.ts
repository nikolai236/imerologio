import { useState } from "react";

const useRowErrors = () => {
	const [rowErrorById, setRowErrorById] = useState<Record<number, string|null>>({});

	const setRowError = (id: number, msg: string) => {
		setRowErrorById((prev) => ({ ...prev, [id]: msg }));
	};

	const clearRowError = (id: number) => {
		setRowErrorById((prev) => ({ ...prev, [id]: null }));
	};

	return {
		rowErrorById,
		setRowError,
		clearRowError,
	};
};

export default useRowErrors;