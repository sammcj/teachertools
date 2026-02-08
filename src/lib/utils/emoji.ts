import type { AnimalEmoji } from '$lib/types';

export const animalEmojis: AnimalEmoji[] = [
	{ emoji: '\u{1F998}', name: 'Kangaroos' },
	{ emoji: '\u{1F428}', name: 'Koalas' },
	{ emoji: '\u{1F42C}', name: 'Dolphins' },
	{ emoji: '\u{1F992}', name: 'Giraffes' },
	{ emoji: '\u{1F43C}', name: 'Pandas' },
	{ emoji: '\u{1F430}', name: 'Rabbits' },
	{ emoji: '\u{1F436}', name: 'Puppies' },
	{ emoji: '\u{1F431}', name: 'Cats' },
	{ emoji: '\u{1F981}', name: 'Lions' },
	{ emoji: '\u{1F43B}', name: 'Bears' },
	{ emoji: '\u{1F418}', name: 'Elephants' },
	{ emoji: '\u{1F989}', name: 'Owls' },
	{ emoji: '\u{1F985}', name: 'Eagles' },
	{ emoji: '\u{1F422}', name: 'Turtles' },
	{ emoji: '\u{1F42F}', name: 'Tigers' },
	{ emoji: '\u{1F98A}', name: 'Foxes' }
];

export function formatGroupName(index: number, useEmojiNames: boolean): string {
	if (useEmojiNames) {
		const emojiIndex = index % animalEmojis.length;
		const animal = animalEmojis[emojiIndex];
		return `${animal.emoji} ${animal.name}`;
	}
	return `Group ${index + 1}`;
}

export function getGroupEmoji(index: number): string {
	return animalEmojis[index % animalEmojis.length].emoji;
}
