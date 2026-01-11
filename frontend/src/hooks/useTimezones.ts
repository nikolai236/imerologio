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
		if (!datePart || !timePart) return NaN;

		const [Y, M, D] = datePart.split("-").map(Number);
		const [h, m] = timePart.split(":").map(Number);

		if (![Y, M, D, h, m].every(Number.isFinite)) return NaN;

		const guessUtcMs = Date.UTC(Y, M - 1, D, h, m, 0);

		const a = guessUtcMs - tzOffsetMinutes(new Date(guessUtcMs)) * 60_000;
		const b = guessUtcMs - tzOffsetMinutes(new Date(a)) * 60_000;

		return b;
	};

	const epochToDateStrInTZ = (epochMs?: number) => {
		if (epochMs == null || !Number.isFinite(epochMs)) return "";

		const get = (t: string) => format
			.formatToParts(new Date(epochMs))
			.find(p => p.type === t)?.value ?? "";

		return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
	};

	const dateStrToEpochMs = (date: string) => {
		const [d, t] = date.split("T");
		if (!d || !t) return NaN;

		const [Y, M, D] = d.split("-").map(Number);
		const [h, m] = t.split(":").map(Number);
		if (![Y, M, D, h, m].every(Number.isFinite)) return NaN;

		const utcGuess = Date.UTC(Y, M - 1, D, h, m, 0);

		let corrected = utcGuess - tzOffsetMinutes(new Date(utcGuess)) * 60_000;
		corrected = utcGuess - tzOffsetMinutes(new Date(corrected)) * 60_000;

		return corrected;
	}

	return {
		epochToDateStrInTZ,
		dateStrToDateInTZ,
		dateStrToEpochMs
	};
};

export default useTimezones;