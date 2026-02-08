interface StudentViewData {
	id: string;
	name: string;
	groups: string[][];
	useEmojiNames?: boolean;
}

/**
 * Encode group data for URL parameter passing.
 */
export function encodeGroupData(data: StudentViewData): string {
	return btoa(JSON.stringify(data));
}

/**
 * Decode group data from a URL parameter.
 */
export function decodeGroupData(encoded: string): StudentViewData | null {
	try {
		return JSON.parse(atob(encoded)) as StudentViewData;
	} catch {
		return null;
	}
}

/**
 * Build the student view URL with encoded data.
 */
export function buildStudentViewUrl(
	base: string,
	listId: string,
	listName: string,
	groups: string[][] | null,
	useEmojiNames: boolean
): string {
	if (groups && groups.length > 0) {
		const data: StudentViewData = {
			id: listId,
			name: listName,
			groups,
			useEmojiNames
		};
		const encoded = encodeGroupData(data);
		return `${base}/student?list=${listId}&data=${encoded}`;
	}
	return `${base}/student?list=${listId}`;
}
