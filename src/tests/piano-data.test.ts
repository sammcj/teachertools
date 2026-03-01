import { describe, it, expect } from 'vitest';
import {
	buildNotes,
	getNotesForRange,
	buildKeyToNoteMap,
	isInScale,
	NOTE_COLOURS,
	DEFAULT_SETTINGS
} from '$lib/utils/piano-data';

describe('buildNotes', () => {
	it('builds 12 notes for a single octave', () => {
		const notes = buildNotes(4, 4);
		expect(notes).toHaveLength(12);
	});

	it('builds 24 notes for two octaves', () => {
		const notes = buildNotes(4, 5);
		expect(notes).toHaveLength(24);
	});

	it('builds 36 notes for three octaves', () => {
		const notes = buildNotes(3, 5);
		expect(notes).toHaveLength(36);
	});

	it('generates correct A4 frequency (440 Hz)', () => {
		const notes = buildNotes(4, 4);
		const a4 = notes.find((n) => n.id === 'A4');
		expect(a4).toBeDefined();
		expect(a4!.frequency).toBeCloseTo(440, 1);
	});

	it('generates correct C4 frequency (~261.63 Hz)', () => {
		const notes = buildNotes(4, 4);
		const c4 = notes.find((n) => n.id === 'C4');
		expect(c4).toBeDefined();
		expect(c4!.frequency).toBeCloseTo(261.63, 0);
	});

	it('has 7 white keys and 5 black keys per octave', () => {
		const notes = buildNotes(4, 4);
		const white = notes.filter((n) => !n.isBlack);
		const black = notes.filter((n) => n.isBlack);
		expect(white).toHaveLength(7);
		expect(black).toHaveLength(5);
	});

	it('assigns correct staff positions for E4 and C4', () => {
		const notes = buildNotes(4, 4);
		const e4 = notes.find((n) => n.id === 'E4');
		const c4 = notes.find((n) => n.id === 'C4');
		expect(e4!.staffPosition).toBe(0);
		expect(c4!.staffPosition).toBe(-2);
	});

	it('assigns Boomwhacker colours to natural notes', () => {
		const notes = buildNotes(4, 4);
		const c4 = notes.find((n) => n.id === 'C4');
		expect(c4!.colour).toBe(NOTE_COLOURS['C']);
	});

	it('assigns keyboard keys to mapped notes', () => {
		const notes = buildNotes(4, 4);
		const c4 = notes.find((n) => n.id === 'C4');
		expect(c4!.keyboardKey).toBe('a');
		const a4 = notes.find((n) => n.id === 'A4');
		expect(a4!.keyboardKey).toBe('h');
	});
});

describe('getNotesForRange', () => {
	it('returns 12 notes for range 1', () => {
		expect(getNotesForRange(1)).toHaveLength(12);
	});

	it('returns 24 notes for range 2', () => {
		expect(getNotesForRange(2)).toHaveLength(24);
	});

	it('returns 36 notes for range 3', () => {
		expect(getNotesForRange(3)).toHaveLength(36);
	});

	it('range 1 starts at C4 and ends at B4', () => {
		const notes = getNotesForRange(1);
		expect(notes[0].id).toBe('C4');
		expect(notes[notes.length - 1].id).toBe('B4');
	});

	it('range 3 starts at C3 and ends at B5', () => {
		const notes = getNotesForRange(3);
		expect(notes[0].id).toBe('C3');
		expect(notes[notes.length - 1].id).toBe('B5');
	});
});

describe('buildKeyToNoteMap', () => {
	it('maps keyboard keys to note IDs', () => {
		const notes = getNotesForRange(2);
		const map = buildKeyToNoteMap(notes);
		expect(map.get('a')).toBe('C4');
		expect(map.get('w')).toBe('C#4');
		expect(map.get('k')).toBe('C5');
	});

	it('does not include keys for unmapped notes', () => {
		const notes = getNotesForRange(1);
		const map = buildKeyToNoteMap(notes);
		// Octave 5 keys should not be present in range 1
		expect(map.has('k')).toBe(false);
	});
});

describe('isInScale', () => {
	const notes = getNotesForRange(2);
	const findNote = (id: string) => notes.find((n) => n.id === id)!;

	it('returns true for all notes when scale is "none"', () => {
		for (const note of notes) {
			expect(isInScale(note, 'none')).toBe(true);
		}
	});

	it('identifies C Major scale notes correctly', () => {
		expect(isInScale(findNote('C4'), 'c-major')).toBe(true);
		expect(isInScale(findNote('D4'), 'c-major')).toBe(true);
		expect(isInScale(findNote('E4'), 'c-major')).toBe(true);
		expect(isInScale(findNote('F4'), 'c-major')).toBe(true);
		expect(isInScale(findNote('G4'), 'c-major')).toBe(true);
		expect(isInScale(findNote('A4'), 'c-major')).toBe(true);
		expect(isInScale(findNote('B4'), 'c-major')).toBe(true);
	});

	it('excludes sharps from C Major', () => {
		expect(isInScale(findNote('C#4'), 'c-major')).toBe(false);
		expect(isInScale(findNote('D#4'), 'c-major')).toBe(false);
		expect(isInScale(findNote('F#4'), 'c-major')).toBe(false);
		expect(isInScale(findNote('G#4'), 'c-major')).toBe(false);
		expect(isInScale(findNote('A#4'), 'c-major')).toBe(false);
	});

	it('includes F# in G Major', () => {
		expect(isInScale(findNote('F#4'), 'g-major')).toBe(true);
		expect(isInScale(findNote('F4'), 'g-major')).toBe(false);
	});

	it('includes A# (enharmonic Bb) in F Major', () => {
		expect(isInScale(findNote('A#4'), 'f-major')).toBe(true);
		expect(isInScale(findNote('A4'), 'f-major')).toBe(true);
		// F Major has Bb (= A#), not B natural
		expect(isInScale(findNote('B4'), 'f-major')).toBe(false);
	});

	it('A Minor is same notes as C Major', () => {
		for (const note of notes.filter((n) => !n.isBlack)) {
			expect(isInScale(note, 'a-minor')).toBe(true);
		}
	});
});

describe('DEFAULT_SETTINGS', () => {
	it('has expected default values', () => {
		expect(DEFAULT_SETTINGS.showLabels).toBe(true);
		expect(DEFAULT_SETTINGS.showKeyboardShortcuts).toBe(false);
		expect(DEFAULT_SETTINGS.showColours).toBe(true);
		expect(DEFAULT_SETTINGS.showStaff).toBe(true);
		expect(DEFAULT_SETTINGS.soundEnabled).toBe(true);
		expect(DEFAULT_SETTINGS.waveform).toBe('piano');
		expect(DEFAULT_SETTINGS.octaveRange).toBe(2);
		expect(DEFAULT_SETTINGS.highlightScale).toBe('none');
	});
});
