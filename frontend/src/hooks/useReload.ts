import { useState } from "react"

const useReload = (): [number, () => void] => {
	const [token, setToken] = useState(0);

	const reload = () => setToken(t => t + 1);
	return [token, reload];
};

export default useReload;