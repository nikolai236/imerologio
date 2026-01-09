export type FolderColor = 'Grey'|'Yellow'|'Orange'| 'Red';

export interface NewsEvent {
	name: string;
	eventTs: Date;
	folderColor: FolderColor;
	currencies: string[];
	source: string;
}

export interface NewsEventWithId extends NewsEvent {
	id: number;
}
