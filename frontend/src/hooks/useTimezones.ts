const useTimezones = (timeZone = "America/New_York") => {

	const format = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	const tzOffsetMinutes = (at: Date,) => {
		const tzName = format
			.formatToParts(at)
			.find(p =>p.type === "timeZoneName")
			?.value ?? "GMT";

		const m = tzName.match(
			/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/
		);
		if (!m) return 0;

		const sign = m[1] === "-" ? -1 : 1;
		const hh = Number(m[2]);
		const mm = Number(m[3] ?? "0");

		return sign * (hh * 60 + mm);
	};

	const dateStrToDateInTZ = (value: string) => {
		const [datePart, timePart] = value.split("T");
		if (!datePart || !timePart) return null;

		const [Y, M, D] = datePart.split("-").map(Number);
		const [h, m] = timePart.split(":").map(Number);

		if (![Y, M, D, h, m].every(Number.isFinite)) return NaN;

		const guessUtcMs = Date.UTC(Y, M - 1, D, h, m, 0);

		const a = guessUtcMs - tzOffsetMinutes(new Date(guessUtcMs)) * 60_000;
		const b = guessUtcMs - tzOffsetMinutes(new Date(a)) * 60_000;

		return b;
	};

	const epochToDateStrInTZ = (epochMs?: number|null) => {
		if (epochMs == null || !Number.isFinite(epochMs)) return "";

		const parts = new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		}).formatToParts(new Date(epochMs));

		const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";

		const Y = get("year");
		const M = get("month");
		const D = get("day");
		const h = get("hour");
		const m = get("minute");

		return Y && M && D && h && m ? `${Y}-${M}-${D}T${h}:${m}` : "";
	};

	const dateStrToEpochMs = (value: string) => {
		if (!value) return null;

		const [datePart, timePart] = value.split("T");
		if (!datePart || !timePart) return null;

		const [Y, M, D] = datePart.split("-").map(Number);
		const [h, m] = timePart.split(":").map(Number);
		if (![Y, M, D, h, m].every(Number.isFinite)) return null;

		let guess = Date.UTC(Y, M - 1, D, h, m, 0);

		for (let i = 0; i < 4; i++) {
			const parts = new Intl.DateTimeFormat("en-CA", {
				timeZone,
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			}).formatToParts(new Date(guess));

			const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";

			const diff =
				Date.UTC(Y, M - 1, D, h, m) -
				Date.UTC(
					Number(get("year")),
					Number(get("month")) - 1,
					Number(get("day")),
					Number(get("hour")),
					Number(get("minute"))
				);

			if (diff === 0) return guess;
			guess += diff;
		}

		return guess;
	};

	return {
		epochToDateStrInTZ,
		dateStrToDateInTZ,
		dateStrToEpochMs
	};
};

export default useTimezones;