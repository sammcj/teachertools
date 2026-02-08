import { describe, it, expect } from 'vitest';
import { createGroups, validateGroups, generateGroups } from '$lib/utils/grouping';

describe('createGroups', () => {
	it('returns empty array for empty student list', () => {
		expect(createGroups([], 3)).toEqual([]);
	});

	it('returns single group when students <= groupSize', () => {
		const result = createGroups(['Alice', 'Bob'], 3);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual(['Alice', 'Bob']);
	});

	it('never creates single-person groups (5 students, size 2)', () => {
		const students = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
		const result = createGroups(students, 2);
		for (const group of result) {
			expect(group.length).toBeGreaterThanOrEqual(2);
		}
		expect(result.flat().sort()).toEqual(students.sort());
	});

	it('never creates single-person groups (7 students, size 3)', () => {
		const students = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace'];
		const result = createGroups(students, 3);
		for (const group of result) {
			expect(group.length).toBeGreaterThanOrEqual(2);
		}
		expect(result.flat().sort()).toEqual(students.sort());
	});

	it('never creates single-person groups (10 students, size 3)', () => {
		const students = Array.from({ length: 10 }, (_, i) => `Student ${i + 1}`);
		const result = createGroups(students, 3);
		for (const group of result) {
			expect(group.length).toBeGreaterThanOrEqual(2);
		}
		expect(result.flat().sort()).toEqual(students.sort());
	});

	it('never creates single-person groups (11 students, size 4)', () => {
		const students = Array.from({ length: 11 }, (_, i) => `Student ${i + 1}`);
		const result = createGroups(students, 4);
		for (const group of result) {
			expect(group.length).toBeGreaterThanOrEqual(2);
		}
	});

	it('handles 4 students with group size 3 -- avoids single-person group', () => {
		const students = ['Alice', 'Bob', 'Charlie', 'David'];
		const result = createGroups(students, 3);
		for (const group of result) {
			expect(group.length).toBeGreaterThanOrEqual(2);
		}
		expect(result.flat().sort()).toEqual(students.sort());
	});
});

describe('validateGroups', () => {
	it('returns true with no blacklist', () => {
		expect(validateGroups([['Alice', 'Bob']], [])).toBe(true);
	});

	it('returns false when blacklisted pair shares a group', () => {
		const groups = [['Alice', 'Bob', 'Charlie']];
		const blacklist: [string, string][] = [['Alice', 'Bob']];
		expect(validateGroups(groups, blacklist)).toBe(false);
	});

	it('returns true when blacklisted pair is in different groups', () => {
		const groups = [['Alice', 'Charlie'], ['Bob', 'David']];
		const blacklist: [string, string][] = [['Alice', 'Bob']];
		expect(validateGroups(groups, blacklist)).toBe(true);
	});
});

describe('generateGroups', () => {
	it('returns empty array for empty student list', () => {
		expect(generateGroups([], 3)).toEqual([]);
	});

	it('generates groups with all students accounted for', () => {
		const students = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'];
		const result = generateGroups(students, 3);
		expect(result.flat().sort()).toEqual(students.sort());
	});

	it('respects blacklist constraints when possible', () => {
		const students = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'];
		const blacklist: [string, string][] = [['Alice', 'Bob']];

		// Run multiple times since it is randomised
		for (let i = 0; i < 10; i++) {
			const result = generateGroups(students, 3, blacklist);
			const valid = validateGroups(result, blacklist);
			expect(valid).toBe(true);
		}
	});
});
