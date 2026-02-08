export interface ClassList {
	name: string;
	students: string[];
	blacklist: [string, string][];
	groupSize: number;
	currentGroups: string[][] | null;
	useEmojiNames: boolean;
}

export interface AppData {
	lists: Record<string, ClassList>;
	currentList: string | null;
	version: string;
}

export interface AnimalEmoji {
	emoji: string;
	name: string;
}

export interface AddStudentsResult {
	success: boolean;
	addedCount: number;
	duplicateCount: number;
}

export interface ToastMessage {
	id: string;
	message: string;
	type: 'info' | 'error' | 'success';
	linkText?: string;
	linkHref?: string;
}
