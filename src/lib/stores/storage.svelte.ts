import { browser } from '$app/environment';
import type { AppData, ClassList, AddStudentsResult, ToastMessage } from '$lib/types';

const STORAGE_KEY = 'groupThing_data';

const DEFAULT_DATA: AppData = {
	lists: {},
	currentList: null,
	version: '2.0.0'
};

function createDefaultList(name: string): ClassList {
	return {
		name,
		students: [],
		blacklist: [],
		groupSize: 3,
		currentGroups: null,
		useEmojiNames: true
	};
}

function loadFromStorage(): AppData {
	if (!browser) return { ...DEFAULT_DATA };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...DEFAULT_DATA };
		const parsed = JSON.parse(raw) as AppData;
		return parsed;
	} catch {
		return { ...DEFAULT_DATA };
	}
}

function saveToStorage(data: AppData): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (e) {
		console.error('Failed to save to localStorage:', e);
	}
}

// --- Reactive store using Svelte 5 runes ---

let data = $state<AppData>(loadFromStorage());
let toasts = $state<ToastMessage[]>([]);

function persist(): void {
	saveToStorage(data);
}

// --- Toast notifications ---

export function addToast(
	message: string,
	type: ToastMessage['type'] = 'info',
	options?: { linkText?: string; linkHref?: string }
): void {
	const id = crypto.randomUUID();
	toasts.push({ id, message, type, ...options });
	setTimeout(() => removeToast(id), options?.linkHref ? 6000 : 3500);
}

export function removeToast(id: string): void {
	toasts = toasts.filter((t) => t.id !== id);
}

export function getToasts(): ToastMessage[] {
	return toasts;
}

// --- Data accessors ---

export function getData(): AppData {
	return data;
}

export function getLists(): Record<string, ClassList> {
	return data.lists;
}

export function getList(listId: string): ClassList | null {
	return data.lists[listId] ?? null;
}

export function getCurrentListId(): string | null {
	return data.currentList;
}

export function getCurrentList(): ClassList | null {
	const id = data.currentList;
	return id ? data.lists[id] ?? null : null;
}

// --- Mutations ---

export function setCurrentList(listId: string | null): void {
	data.currentList = listId;
	persist();
}

export function createList(name: string): string {
	const listId = 'list_' + Date.now();
	data.lists[listId] = createDefaultList(name);
	persist();
	return listId;
}

export function updateListName(listId: string, name: string): boolean {
	const list = data.lists[listId];
	if (!list) return false;
	list.name = name;
	persist();
	return true;
}

export function deleteList(listId: string): void {
	delete data.lists[listId];
	if (data.currentList === listId) {
		data.currentList = null;
	}
	persist();
}

export function saveListOrder(orderedIds: string[]): void {
	const newLists: Record<string, ClassList> = {};
	for (const id of orderedIds) {
		if (data.lists[id]) {
			newLists[id] = data.lists[id];
		}
	}
	data.lists = newLists;
	persist();
}

export function addStudents(listId: string, input: string): AddStudentsResult {
	const list = data.lists[listId];
	if (!list) return { success: false, addedCount: 0, duplicateCount: 0 };

	const names = input.includes('\n')
		? input
				.split('\n')
				.map((n) => n.trim())
				.filter(Boolean)
		: [input.trim()].filter(Boolean);

	let addedCount = 0;
	let duplicateCount = 0;

	for (const name of names) {
		if (list.students.includes(name)) {
			duplicateCount++;
		} else {
			list.students.push(name);
			addedCount++;
		}
	}

	persist();
	return { success: true, addedCount, duplicateCount };
}

export function removeStudents(listId: string, toRemove: string[]): boolean {
	const list = data.lists[listId];
	if (!list || toRemove.length === 0) return false;

	list.students = list.students.filter((s) => !toRemove.includes(s));
	list.blacklist = list.blacklist.filter(
		([a, b]) => !toRemove.includes(a) && !toRemove.includes(b)
	);
	persist();
	return true;
}

export function updateGroupSize(listId: string, size: number): void {
	const list = data.lists[listId];
	if (list) {
		list.groupSize = size;
		persist();
	}
}

export function addIncompatiblePairs(listId: string, students: string[]): number {
	const list = data.lists[listId];
	if (!list || students.length < 2) return 0;

	let addedCount = 0;
	for (let i = 0; i < students.length; i++) {
		for (let j = i + 1; j < students.length; j++) {
			const s1 = students[i];
			const s2 = students[j];
			const exists = list.blacklist.some(
				([a, b]) => (a === s1 && b === s2) || (a === s2 && b === s1)
			);
			if (!exists) {
				list.blacklist.push([s1, s2]);
				addedCount++;
			}
		}
	}

	persist();
	return addedCount;
}

export function removeIncompatiblePairs(listId: string, pairs: [string, string][]): boolean {
	const list = data.lists[listId];
	if (!list || pairs.length === 0) return false;

	list.blacklist = list.blacklist.filter(([a, b]) => {
		return !pairs.some(([pa, pb]) => (a === pa && b === pb) || (a === pb && b === pa));
	});
	persist();
	return true;
}

export function saveGroups(listId: string, groups: string[][]): void {
	const list = data.lists[listId];
	if (list) {
		list.currentGroups = groups;
		persist();
	}
}

export function setUseEmojiNames(listId: string, useEmoji: boolean): void {
	const list = data.lists[listId];
	if (list) {
		list.useEmojiNames = useEmoji;
		persist();
	}
}

export function clearAll(): void {
	data.lists = {};
	data.currentList = null;
	data.version = '2.0.0';
	persist();
}

export function replaceData(newData: AppData): void {
	data.lists = newData.lists;
	data.currentList = newData.currentList;
	data.version = newData.version || '2.0.0';
	persist();
}

export function loadSampleData(): string {
	clearAll();

	const class1Id = 'list_' + Date.now();
	data.lists[class1Id] = {
		name: 'Class 1A',
		students: [
			'Alice Smith',
			'Stephen Fry',
			'David Attenborough',
			'Diana Prince',
			'Malala Yousafzai',
			'Fiona Apple',
			'Jenny Lewis',
			'Maynard James',
			'Nancy Drew'
		],
		blacklist: [
			['Alice Smith', 'David Attenborough'],
			['Maynard James', 'Nancy Drew']
		],
		groupSize: 3,
		currentGroups: null,
		useEmojiNames: true
	};

	const class2Id = 'list_' + (Date.now() + 1);
	data.lists[class2Id] = {
		name: 'Science Group',
		students: [
			'Jane Foster',
			'Bruce Banner',
			'Barry Allen',
			'Steve Rogers',
			'Wanda Maximoff',
			'David Mitchell',
			'Peter Parker',
			'Scott Lang',
			'Rocket Raccoon',
			'Li Junjie',
			'Wang Yichen',
			'Chen Zihan'
		],
		blacklist: [],
		groupSize: 3,
		currentGroups: null,
		useEmojiNames: true
	};

	const class3Id = 'list_' + (Date.now() + 2);
	data.lists[class3Id] = {
		name: 'Book Club',
		students: [
			'Maynard James',
			'Nancy Drew',
			'Charlie Weasley',
			'Emilia Airhart',
			'Ada Lovelace',
			'Grace Hopper',
			'Serena Williams',
			'Ethan Hunt',
			'Jacinda Ardern'
		],
		blacklist: [],
		groupSize: 3,
		currentGroups: null,
		useEmojiNames: true
	};

	data.currentList = class1Id;
	persist();

	return class1Id;
}
