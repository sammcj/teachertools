/**
 * Fisher-Yates shuffle (in-place).
 */
function shuffleArray<T>(array: T[]): void {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

/**
 * Distribute students into groups of roughly `groupSize`, preventing
 * single-person groups where possible.
 */
export function createGroups(students: string[], groupSize: number): string[][] {
	if (students.length === 0) return [];
	if (students.length <= groupSize) return [[...students]];

	const numStudents = students.length;
	let numGroups = Math.ceil(numStudents / groupSize);

	// Prevent single-person remainder groups
	if (numStudents % numGroups === 1 && numGroups > 1) {
		numGroups--;
	}

	const groups: string[][] = Array.from({ length: numGroups }, () => []);

	for (let i = 0; i < numStudents; i++) {
		groups[i % numGroups].push(students[i]);
	}

	// Safety net: merge any single-person groups into the smallest multi-person group
	const singleGroups = groups.filter((g) => g.length === 1);
	for (const single of singleGroups) {
		const multiGroups = groups.filter((g) => g !== single && g.length > 1);
		if (multiGroups.length > 0) {
			multiGroups.sort((a, b) => a.length - b.length);
			multiGroups[0].push(single[0]);
			const idx = groups.indexOf(single);
			groups.splice(idx, 1);
		}
	}

	return groups;
}

/**
 * Check that no blacklisted pair shares a group.
 */
export function validateGroups(groups: string[][], blacklist: [string, string][]): boolean {
	if (blacklist.length === 0) return true;

	for (const group of groups) {
		for (const [s1, s2] of blacklist) {
			if (group.includes(s1) && group.includes(s2)) {
				return false;
			}
		}
	}
	return true;
}

/**
 * Generate random groups respecting blacklist constraints.
 * Retries up to 50 times with a fresh shuffle.
 */
export function generateGroups(
	students: string[],
	groupSize: number,
	blacklist: [string, string][] = []
): string[][] {
	if (!students || students.length === 0) return [];

	const shuffled = [...students];
	const maxAttempts = 50;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		shuffleArray(shuffled);
		const groups = createGroups(shuffled, groupSize);
		if (validateGroups(groups, blacklist)) {
			return groups;
		}
	}

	// Fallback: return best-effort groups
	console.warn(`Could not satisfy all blacklist constraints after ${maxAttempts} attempts.`);
	shuffleArray(shuffled);
	return createGroups(shuffled, groupSize);
}
