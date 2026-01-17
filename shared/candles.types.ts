export interface Candle {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export const Timeframes = {
	tf1s:  "1s",
	tf5s:  "5s",
	tf15s: "15s",
	tf30s: "30s",

	tf1m:  "1m",
	tf2m:  "2m",
	tf3m:  "3m",
	tf5m:  "5m",
	tf10m: "10m",
	tf15m: "15m",
	tf30m: "30m",

	tf1h:  "1h",
	tf2h:  "2h",
	tf4h:  "4h",
	tf6h:  "6h",

	tf1d:  "1d",
	tf1w:  "1w",
} as const;

export type Timeframe = typeof Timeframes[keyof typeof Timeframes];

interface PartialOrder {
	price: number;
	time: number; // in seconds
}

type negative = number;
type positive = number;

export interface Exit extends PartialOrder {
	quantity: negative;
}

export interface Entry extends PartialOrder {
	quantity: positive;
}