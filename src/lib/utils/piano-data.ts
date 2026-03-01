import type { NoteDefinition, NoteName, Accidental, ScaleHighlight, PianoSettings } from '$lib/types/piano';

/** Boomwhacker-inspired colours for natural notes */
export const NOTE_COLOURS: Record<NoteName, string> = {
	C: '#E53935',
	D: '#FB8C00',
	E: '#FDD835',
	F: '#43A047',
	G: '#1E88E5',
	A: '#5E35B1',
	B: '#D81B60'
};

/** Darkened versions for sharps (inherit from lower neighbour) */
export const SHARP_COLOURS: Record<string, string> = {
	'C#': '#B71C1C',
	'D#': '#E65100',
	'F#': '#2E7D32',
	'G#': '#1565C0',
	'A#': '#4527A0'
};

/** Equal temperament frequency for A4 */
const A4_FREQ = 440;
const A4_MIDI = 69;

/** Calculate frequency from MIDI note number */
export function midiToFrequency(midi: number): number {
	return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}

/** MIDI note number from note name + octave */
export function noteToMidi(name: NoteName, accidental: Accidental, octave: number): number {
	const semitones: Record<NoteName, number> = {
		C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11
	};
	return 12 * (octave + 1) + semitones[name] + (accidental === '#' ? 1 : 0);
}

/**
 * Staff position: diatonic steps from E4 (bottom staff line = 0).
 * Sharps share the position of their natural.
 */
function staffPosition(name: NoteName, octave: number): number {
	const diatonicFromC: Record<NoteName, number> = {
		C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6
	};
	const e4Position = 0;
	const diatonicStepsFromE4 = diatonicFromC[name] - diatonicFromC['E'] + (octave - 4) * 7;
	return e4Position + diatonicStepsFromE4;
}

/** Chromatic note sequence within one octave */
const CHROMATIC: { name: NoteName; accidental: Accidental; isBlack: boolean }[] = [
	{ name: 'C', accidental: '', isBlack: false },
	{ name: 'C', accidental: '#', isBlack: true },
	{ name: 'D', accidental: '', isBlack: false },
	{ name: 'D', accidental: '#', isBlack: true },
	{ name: 'E', accidental: '', isBlack: false },
	{ name: 'F', accidental: '', isBlack: false },
	{ name: 'F', accidental: '#', isBlack: true },
	{ name: 'G', accidental: '', isBlack: false },
	{ name: 'G', accidental: '#', isBlack: true },
	{ name: 'A', accidental: '', isBlack: false },
	{ name: 'A', accidental: '#', isBlack: true },
	{ name: 'B', accidental: '', isBlack: false }
];

/** Computer keyboard mapping - lower octave on home row, sharps on row above */
const KEYBOARD_MAP_OCTAVE_4: Record<string, string> = {
	C4: 'a', 'C#4': 'w', D4: 's', 'D#4': 'e', E4: 'd',
	F4: 'f', 'F#4': 't', G4: 'g', 'G#4': 'y', A4: 'h',
	'A#4': 'u', B4: 'j'
};

const KEYBOARD_MAP_OCTAVE_5: Record<string, string> = {
	C5: 'k', 'C#5': 'o', D5: 'l', 'D#5': 'p', E5: ';',
	F5: "'", 'F#5': ']'
};

const KEYBOARD_MAP_OCTAVE_3: Record<string, string> = {
	C3: 'z', 'C#3': '1', D3: 'x', 'D#3': '2', E3: 'c',
	F3: 'v', 'F#3': '4', G3: 'b', 'G#3': '5', A3: 'n',
	'A#3': '6', B3: 'm'
};

const KEYBOARD_MAP: Record<string, string> = {
	...KEYBOARD_MAP_OCTAVE_3,
	...KEYBOARD_MAP_OCTAVE_4,
	...KEYBOARD_MAP_OCTAVE_5
};

/** Build note definitions for a given octave range */
export function buildNotes(startOctave: number, endOctave: number): NoteDefinition[] {
	const notes: NoteDefinition[] = [];
	for (let octave = startOctave; octave <= endOctave; octave++) {
		for (const chromatic of CHROMATIC) {
			const id = `${chromatic.name}${chromatic.accidental}${octave}`;
			const midi = noteToMidi(chromatic.name, chromatic.accidental, octave);
			const colour = chromatic.isBlack
				? SHARP_COLOURS[`${chromatic.name}#`]
				: NOTE_COLOURS[chromatic.name];
			notes.push({
				id,
				name: chromatic.name,
				octave,
				accidental: chromatic.accidental,
				frequency: midiToFrequency(midi),
				staffPosition: staffPosition(chromatic.name, octave),
				isBlack: chromatic.isBlack,
				colour,
				keyboardKey: KEYBOARD_MAP[id]
			});
		}
	}
	return notes;
}

/** Get notes for the configured octave range */
export function getNotesForRange(octaveRange: 1 | 2 | 3): NoteDefinition[] {
	switch (octaveRange) {
		case 1: return buildNotes(4, 4);
		case 2: return buildNotes(4, 5);
		case 3: return buildNotes(3, 5);
	}
}

/** Reverse lookup: keyboard key -> note ID */
export function buildKeyToNoteMap(notes: NoteDefinition[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const note of notes) {
		if (note.keyboardKey) {
			map.set(note.keyboardKey, note.id);
		}
	}
	return map;
}

/** Scale definitions as sets of note names (without octave) */
const SCALE_NOTES: Record<Exclude<ScaleHighlight, 'none'>, Set<string>> = {
	'c-major': new Set(['C', 'D', 'E', 'F', 'G', 'A', 'B']),
	'g-major': new Set(['G', 'A', 'B', 'C', 'D', 'E', 'F#']),
	'f-major': new Set(['F', 'G', 'A', 'Bb', 'C', 'D', 'E']),
	'a-minor': new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
};

/** Check if a note is in the highlighted scale. F Major uses Bb which matches A#. */
export function isInScale(note: NoteDefinition, scale: ScaleHighlight): boolean {
	if (scale === 'none') return true;
	const scaleNotes = SCALE_NOTES[scale];
	const noteLabel = `${note.name}${note.accidental}`;
	// Handle enharmonic: A# = Bb for F Major
	if (noteLabel === 'A#' && scaleNotes.has('Bb')) return true;
	return scaleNotes.has(noteLabel);
}

/** Default settings */
export const DEFAULT_SETTINGS: PianoSettings = {
	showLabels: true,
	showKeyboardShortcuts: false,
	showColours: true,
	showStaff: true,
	soundEnabled: true,
	waveform: 'triangle',
	octaveRange: 2,
	highlightScale: 'none'
};

const SETTINGS_KEY = 'piano_settings';

/** Load settings from localStorage, falling back to defaults */
export function loadSettings(): PianoSettings {
	try {
		const stored = localStorage.getItem(SETTINGS_KEY);
		if (stored) {
			return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
		}
	} catch {
		// Corrupted storage - use defaults
	}
	return { ...DEFAULT_SETTINGS };
}

/** Persist settings to localStorage */
export function saveSettings(settings: PianoSettings): void {
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
	} catch {
		// Storage full or unavailable - silently ignore
	}
}
