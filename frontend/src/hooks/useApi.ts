const API_BASE = import.meta.env.VITE_API_BASE_URL

const useApi = () => {
	const headers = {
		"Content-Type": "application/json",
	};

	const makeReq = async (path: string, method: string, body?: any) => {
		const resp = await fetch(API_BASE + path, {
			headers: body && headers,
			method,
			body: body && JSON.stringify(body)
		});
		const ret  = await resp.json();

		if (!resp.ok) throw new Error(ret.message);
		return ret;
	};

	const makeUploadReq = async (path: string, method: string, file: File) => {
		const body = new FormData();
		body.append('file', file);

		const res = await fetch(API_BASE + path, { method, body });
		if (!res.ok) throw new Error(`Upload failed (${res.status})`);

		const ret = await res.json();
		return ret;
	};

	return {
		get:    (path: string) => makeReq(path, 'GET'),
		delete: (path: string) => makeReq(path, 'DELETE'),

		post:  (path: string, body: any) => makeReq(path, 'POST', body),
		patch: (path: string, body: any) => makeReq(path, 'PATCH', body),

		postFile: (path: string, file: File) => makeUploadReq(path, 'POST', file),
	};
};

export default useApi;