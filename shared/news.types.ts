export const FolderColorsValue = [
  "Grey",
  "Yellow",
  "Orange",
  "Red",
] as const;

export type FolderColor = typeof FolderColorsValue[number];

export type DateString = string;

export interface NewsEvent<
	DateType extends Date | DateString = Date,
> {
	name: string;

	date: DateType;
	allDay: boolean;

	folderColor: FolderColor;
	currencies: string[];

	source: string;
	metadata: Record<string, any>
}

export interface NewsEventWithId<
	DateType extends Date | DateString = Date
> extends NewsEvent<DateType> {
	id: number;
}

export interface EntryCalendar {
	prev: NewsEventWithId[],
	current: NewsEventWithId[],
	next: NewsEventWithId[],
}