const API_BASE = import.meta.env.VITE_API_BASE_URL

const headers = {
	"Content-Type": "application/json",
};

async function makeReq(
	path: string,
	method: "POST" | "GET" | "PATCH" | "DELETE" | "PUT",
	params?: Record<string, any>,
	body?: any
) {
	let url = API_BASE + path;

	if (params != null && Object.keys(params).length > 0) {
		const query = new URLSearchParams(params);
		url += `?${query.toString()}`;
	}

	const resp = await fetch(url, {
		headers: body && headers,
		method,
		body: body && JSON.stringify(body)
	});
	const ret  = await resp.json();

	if (!resp.ok) throw new Error(ret.message);
	return ret;
};

async function makeUploadRequest(path: string, method: string, file: File) {
	const body = new FormData();
	body.append('file', file);

	const res = await fetch(API_BASE + path, { method, body });
	if (!res.ok) throw new Error(`Upload failed (${res.status})`);

	const ret = await res.json();
	return ret;
};

export default {
	get:    (path: string, params?: Record<string, any>) => makeReq(path, "GET", params),
	delete: (path: string) => makeReq(path, "DELETE"),

	post:  (path: string, body: any) => makeReq(path, "POST", undefined, body),
	patch: (path: string, body: any) => makeReq(path, "PATCH", undefined, body),

	postFile: (path: string, file: File) => makeUploadRequest(path, "POST", file),
};
