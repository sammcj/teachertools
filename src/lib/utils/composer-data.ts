import type {
	ComposedNote,
	ComposerKey,
	ComposerSettings,
	ChordType,
	IntervalType,
	NoteDefinition,
	NoteDuration,
	NoteName,
	PitchZone,
	StaffMode
} from '$lib/types/piano';
import { buildNotes, NOTE_COLOURS, noteToMidi, midiToFrequency } from '$lib/utils/piano-data';

/** Beats per duration (quarter note = 1 beat) */
export const DURATION_BEATS: Record<NoteDuration, number> = {
	whole: 4,
	half: 2,
	quarter: 1,
	eighth: 0.5
};

/** Convert a duration to milliseconds at a given BPM */
export function durationMs(duration: NoteDuration, bpm: number): number {
	const beatMs = 60_000 / bpm;
	return DURATION_BEATS[duration] * beatMs;
}

/** Natural notes in octaves 4-5 for the full stave pitch table */
const FULL_STAVE_NOTES = buildNotes(4, 5).filter((n) => n.accidental === '');

// ── Key signature data ──

const SHARP_ORDER: NoteName[] = ['F', 'C', 'G', 'D', 'A'];
const KEY_SHARP_COUNT: Record<ComposerKey, number> = {
	C: 0, G: 1, D: 2, A: 3, E: 4, B: 5
};

/** Returns which note names get sharps for a given key */
export function sharpedNotesForKey(key: ComposerKey): Set<NoteName> {
	const count = KEY_SHARP_COUNT[key];
	return new Set(SHARP_ORDER.slice(0, count));
}

/**
 * Staff positions where sharp symbols should render in the key signature.
 * Conventional treble clef sharp positions: F#=8, C#=5, G#=9, D#=6, A#=3
 */
const KEY_SIG_STAFF_POSITIONS: number[] = [8, 5, 9, 6, 3];

export function keySignaturePositions(key: ComposerKey): number[] {
	const count = KEY_SHARP_COUNT[key];
	return KEY_SIG_STAFF_POSITIONS.slice(0, count);
}

// ── Interval / chord data ──

export const INTERVAL_SEMITONES: Record<IntervalType, number> = {
	'minor-3rd': 3,
	'major-3rd': 4,
	'perfect-4th': 5,
	'perfect-5th': 7,
	octave: 12
};

export const INTERVAL_LABELS: Record<IntervalType, string> = {
	'minor-3rd': 'Minor 3rd',
	'major-3rd': 'Major 3rd',
	'perfect-4th': 'Perfect 4th',
	'perfect-5th': 'Perfect 5th',
	octave: 'Octave'
};

export const CHORD_SEMITONES: Record<ChordType, [number, number]> = {
	major: [4, 7],
	minor: [3, 7]
};

// ── Dynamic zone note computation ──

/** Chromatic note names starting from C for lookup by semitone offset */
const CHROMATIC_NAMES: { name: NoteName; sharp: boolean }[] = [
	{ name: 'C', sharp: false },
	{ name: 'C', sharp: true },
	{ name: 'D', sharp: false },
	{ name: 'D', sharp: true },
	{ name: 'E', sharp: false },
	{ name: 'F', sharp: false },
	{ name: 'F', sharp: true },
	{ name: 'G', sharp: false },
	{ name: 'G', sharp: true },
	{ name: 'A', sharp: false },
	{ name: 'A', sharp: true },
	{ name: 'B', sharp: false }
];

export interface ResolvedNote {
	frequency: number;
	noteName: string;
	colour: string;
}

/** Compute the note at a given semitone offset from a root in octave 4 */
export function noteAtInterval(root: NoteName, semitones: number): ResolvedNote {
	const rootMidi = noteToMidi(root, '', 4);
	const targetMidi = rootMidi + semitones;
	const frequency = midiToFrequency(targetMidi);

	// Work out which chromatic note this lands on
	const semitoneInOctave = ((targetMidi % 12) + 12) % 12;
	const chromatic = CHROMATIC_NAMES[semitoneInOctave];
	const displayName = chromatic.sharp
		? `${chromatic.name}#`
		: `${chromatic.name}`;
	const colour = NOTE_COLOURS[chromatic.name];

	return { frequency, noteName: displayName, colour };
}

/** Compute the three zone notes for three-line mode */
export function threeLineZoneNotes(
	root: ComposerKey,
	chordType: ChordType
): Record<PitchZone, ResolvedNote> {
	const [thirdSemitones, fifthSemitones] = CHORD_SEMITONES[chordType];
	return {
		low: noteAtInterval(root, 0),
		middle: noteAtInterval(root, thirdSemitones),
		high: noteAtInterval(root, fifthSemitones)
	};
}

/** Compute the two zone notes for one-line mode */
export function oneLineZoneNotes(
	root: ComposerKey,
	interval: IntervalType
): Record<'low' | 'high', ResolvedNote> {
	return {
		low: noteAtInterval(root, 0),
		high: noteAtInterval(root, INTERVAL_SEMITONES[interval])
	};
}

// ── Resolve functions ──

export interface ResolvedPitch {
	staffPosition: number;
	pitchZone: PitchZone;
	frequency: number;
	noteName: string;
	colour: string;
}

/**
 * Resolve a click Y position to a diatonic staff position on a full 5-line stave.
 * When a key is provided, sharped notes get their sharp frequency/name.
 */
export function resolveFullStavePitch(
	clickY: number,
	bottomLineY: number,
	lineSpacing: number,
	key: ComposerKey = 'C'
): ResolvedPitch | null {
	const halfSpace = lineSpacing / 2;
	const rawPosition = (bottomLineY - clickY) / halfSpace;
	const snapped = Math.round(rawPosition);

	if (snapped < -2 || snapped > 12) return null;

	const note = FULL_STAVE_NOTES.find((n) => n.staffPosition === snapped);
	if (!note) return null;

	const zone: PitchZone = snapped <= 2 ? 'low' : snapped <= 6 ? 'middle' : 'high';
	const sharps = sharpedNotesForKey(key);

	if (sharps.has(note.name)) {
		const sharpMidi = noteToMidi(note.name, '#', note.octave);
		return {
			staffPosition: snapped,
			pitchZone: zone,
			frequency: midiToFrequency(sharpMidi),
			noteName: `${note.name}#`,
			colour: NOTE_COLOURS[note.name]
		};
	}

	return {
		staffPosition: snapped,
		pitchZone: zone,
		frequency: note.frequency,
		noteName: `${note.name}`,
		colour: NOTE_COLOURS[note.name]
	};
}

/**
 * Resolve a click Y to the nearest of 3 lines (low/middle/high).
 * Uses provided zone notes for pitch data.
 */
export function resolveThreeLinePitch(
	clickY: number,
	lineYs: { low: number; middle: number; high: number },
	zoneNotes?: Record<PitchZone, ResolvedNote>
): ResolvedPitch {
	const distances = {
		low: Math.abs(clickY - lineYs.low),
		middle: Math.abs(clickY - lineYs.middle),
		high: Math.abs(clickY - lineYs.high)
	};

	let nearest: PitchZone = 'low';
	if (distances.middle < distances[nearest]) nearest = 'middle';
	if (distances.high < distances[nearest]) nearest = 'high';

	if (zoneNotes) {
		const resolved = zoneNotes[nearest];
		return {
			staffPosition: nearest === 'low' ? 0 : nearest === 'middle' ? 1 : 2,
			pitchZone: nearest,
			frequency: resolved.frequency,
			noteName: resolved.noteName,
			colour: resolved.colour
		};
	}

	// Backward-compatible fallback: C major triad
	const fallbackNotes = {
		low: FULL_STAVE_NOTES.find((n) => n.id === 'C4')!,
		middle: FULL_STAVE_NOTES.find((n) => n.id === 'E4')!,
		high: FULL_STAVE_NOTES.find((n) => n.id === 'G4')!
	};
	const note = fallbackNotes[nearest];
	return {
		staffPosition: nearest === 'low' ? 0 : nearest === 'middle' ? 1 : 2,
		pitchZone: nearest,
		frequency: note.frequency,
		noteName: nearest.charAt(0).toUpperCase() + nearest.slice(1),
		colour: NOTE_COLOURS[note.name]
	};
}

/**
 * Resolve a click Y to above (high) or below (low) a single line.
 * Uses provided zone notes for pitch data.
 */
export function resolveOneLinePitch(
	clickY: number,
	lineY: number,
	zoneNotes?: Record<'low' | 'high', ResolvedNote>
): ResolvedPitch {
	const zone: PitchZone = clickY < lineY ? 'high' : 'low';

	if (zoneNotes) {
		const resolved = zoneNotes[zone];
		return {
			staffPosition: zone === 'low' ? 0 : 1,
			pitchZone: zone,
			frequency: resolved.frequency,
			noteName: resolved.noteName,
			colour: resolved.colour
		};
	}

	// Backward-compatible fallback: C4/G4
	const fallbackNotes = {
		low: FULL_STAVE_NOTES.find((n) => n.id === 'C4')!,
		high: FULL_STAVE_NOTES.find((n) => n.id === 'G4')!
	};
	const note = fallbackNotes[zone];
	return {
		staffPosition: zone === 'low' ? 0 : 1,
		pitchZone: zone,
		frequency: note.frequency,
		noteName: zone === 'high' ? 'High' : 'Low',
		colour: NOTE_COLOURS[note.name]
	};
}

/**
 * Shift a note's pitch by one diatonic step in the given direction.
 * Returns null if the resulting position is out of range.
 */
export function shiftPitch(
	staffMode: StaffMode,
	currentPosition: number,
	currentZone: PitchZone,
	direction: 1 | -1,
	key: ComposerKey = 'C',
	threeLineNotes?: Record<PitchZone, ResolvedNote>,
	oneLineNotes?: Record<'low' | 'high', ResolvedNote>
): ResolvedPitch | null {
	if (staffMode === 'full') {
		const newPosition = currentPosition + direction;
		const note = FULL_STAVE_NOTES.find((n) => n.staffPosition === newPosition);
		if (!note) return null;
		const zone: PitchZone = newPosition <= 2 ? 'low' : newPosition <= 6 ? 'middle' : 'high';
		const sharps = sharpedNotesForKey(key);

		if (sharps.has(note.name)) {
			const sharpMidi = noteToMidi(note.name, '#', note.octave);
			return {
				staffPosition: newPosition,
				pitchZone: zone,
				frequency: midiToFrequency(sharpMidi),
				noteName: `${note.name}#`,
				colour: NOTE_COLOURS[note.name]
			};
		}

		return {
			staffPosition: newPosition,
			pitchZone: zone,
			frequency: note.frequency,
			noteName: `${note.name}`,
			colour: NOTE_COLOURS[note.name]
		};
	} else if (staffMode === 'three-line') {
		const zones: PitchZone[] = ['low', 'middle', 'high'];
		const idx = zones.indexOf(currentZone);
		const newIdx = idx + direction;
		if (newIdx < 0 || newIdx > 2) return null;
		const zone = zones[newIdx];

		if (threeLineNotes) {
			const resolved = threeLineNotes[zone];
			return {
				staffPosition: newIdx,
				pitchZone: zone,
				frequency: resolved.frequency,
				noteName: resolved.noteName,
				colour: resolved.colour
			};
		}

		// Fallback: C major triad
		const fallbackNotes: Record<PitchZone, NoteDefinition> = {
			low: FULL_STAVE_NOTES.find((n) => n.id === 'C4')!,
			middle: FULL_STAVE_NOTES.find((n) => n.id === 'E4')!,
			high: FULL_STAVE_NOTES.find((n) => n.id === 'G4')!
		};
		const note = fallbackNotes[zone];
		return {
			staffPosition: newIdx,
			pitchZone: zone,
			frequency: note.frequency,
			noteName: zone.charAt(0).toUpperCase() + zone.slice(1),
			colour: NOTE_COLOURS[note.name]
		};
	} else {
		if (direction === 1 && currentZone === 'low') {
			const resolved = oneLineNotes?.high;
			if (resolved) {
				return {
					staffPosition: 1,
					pitchZone: 'high',
					frequency: resolved.frequency,
					noteName: resolved.noteName,
					colour: resolved.colour
				};
			}
			const fallback = FULL_STAVE_NOTES.find((n) => n.id === 'G4')!;
			return {
				staffPosition: 1,
				pitchZone: 'high',
				frequency: fallback.frequency,
				noteName: 'High',
				colour: NOTE_COLOURS[fallback.name]
			};
		}
		if (direction === -1 && currentZone === 'high') {
			const resolved = oneLineNotes?.low;
			if (resolved) {
				return {
					staffPosition: 0,
					pitchZone: 'low',
					frequency: resolved.frequency,
					noteName: resolved.noteName,
					colour: resolved.colour
				};
			}
			const fallback = FULL_STAVE_NOTES.find((n) => n.id === 'C4')!;
			return {
				staffPosition: 0,
				pitchZone: 'low',
				frequency: fallback.frequency,
				noteName: 'Low',
				colour: NOTE_COLOURS[fallback.name]
			};
		}
		return null;
	}
}

/**
 * Map a piano NoteDefinition to a ResolvedPitch for the given staff mode.
 */
export function resolveNoteToStaffPitch(
	staffMode: StaffMode,
	note: NoteDefinition,
	key: ComposerKey = 'C',
	threeLineNotes?: Record<PitchZone, ResolvedNote>,
	oneLineNotes?: Record<'low' | 'high', ResolvedNote>
): ResolvedPitch | null {
	const pos = note.staffPosition;

	if (staffMode === 'full') {
		if (note.accidental !== '') return null;
		if (pos < -2 || pos > 11) return null;
		const zone: PitchZone = pos <= 2 ? 'low' : pos <= 6 ? 'middle' : 'high';
		const sharps = sharpedNotesForKey(key);

		if (sharps.has(note.name)) {
			const sharpMidi = noteToMidi(note.name, '#', note.octave);
			return {
				staffPosition: pos,
				pitchZone: zone,
				frequency: midiToFrequency(sharpMidi),
				noteName: `${note.name}#`,
				colour: NOTE_COLOURS[note.name]
			};
		}

		return {
			staffPosition: pos,
			pitchZone: zone,
			frequency: note.frequency,
			noteName: `${note.name}`,
			colour: NOTE_COLOURS[note.name]
		};
	}

	if (staffMode === 'three-line') {
		const anchors: { zone: PitchZone; pos: number }[] = [
			{ zone: 'low', pos: -2 },
			{ zone: 'middle', pos: 0 },
			{ zone: 'high', pos: 2 }
		];
		let nearest = anchors[0];
		for (const a of anchors) {
			if (Math.abs(pos - a.pos) < Math.abs(pos - nearest.pos)) nearest = a;
		}

		if (threeLineNotes) {
			const resolved = threeLineNotes[nearest.zone];
			return {
				staffPosition: nearest.zone === 'low' ? 0 : nearest.zone === 'middle' ? 1 : 2,
				pitchZone: nearest.zone,
				frequency: resolved.frequency,
				noteName: resolved.noteName,
				colour: resolved.colour
			};
		}

		// Fallback
		const fallbackNotes: Record<PitchZone, NoteDefinition> = {
			low: FULL_STAVE_NOTES.find((n) => n.id === 'C4')!,
			middle: FULL_STAVE_NOTES.find((n) => n.id === 'E4')!,
			high: FULL_STAVE_NOTES.find((n) => n.id === 'G4')!
		};
		const zoneNote = fallbackNotes[nearest.zone];
		return {
			staffPosition: nearest.zone === 'low' ? 0 : nearest.zone === 'middle' ? 1 : 2,
			pitchZone: nearest.zone,
			frequency: zoneNote.frequency,
			noteName: nearest.zone.charAt(0).toUpperCase() + nearest.zone.slice(1),
			colour: NOTE_COLOURS[zoneNote.name]
		};
	}

	// One-line: snap to nearest of C4(pos -2) or G4(pos 2)
	const zone: PitchZone = Math.abs(pos - 2) <= Math.abs(pos - (-2)) ? 'high' : 'low';

	if (oneLineNotes) {
		const resolved = oneLineNotes[zone];
		return {
			staffPosition: zone === 'low' ? 0 : 1,
			pitchZone: zone,
			frequency: resolved.frequency,
			noteName: resolved.noteName,
			colour: resolved.colour
		};
	}

	// Fallback
	const fallbackNotes = {
		low: FULL_STAVE_NOTES.find((n) => n.id === 'C4')!,
		high: FULL_STAVE_NOTES.find((n) => n.id === 'G4')!
	};
	const zoneNote = fallbackNotes[zone];
	return {
		staffPosition: zone === 'low' ? 0 : 1,
		pitchZone: zone,
		frequency: zoneNote.frequency,
		noteName: zone === 'low' ? 'Low' : 'High',
		colour: NOTE_COLOURS[zoneNote.name]
	};
}

/**
 * Remap existing notes to new pitches based on current settings.
 * Full stave: re-resolves each staffPosition with new key signature.
 * Three-line / one-line: re-resolves each pitchZone with new zone notes.
 */
export function remapNotes(
	notes: ComposedNote[],
	staffMode: StaffMode,
	key: ComposerKey,
	chordType: ChordType,
	interval: IntervalType
): ComposedNote[] {
	if (staffMode === 'full') {
		const sharps = sharpedNotesForKey(key);
		return notes.map((n) => {
			const staveNote = FULL_STAVE_NOTES.find((sn) => sn.staffPosition === n.staffPosition);
			if (!staveNote) return n;

			if (sharps.has(staveNote.name)) {
				const sharpMidi = noteToMidi(staveNote.name, '#', staveNote.octave);
				return {
					...n,
					frequency: midiToFrequency(sharpMidi),
					noteName: `${staveNote.name}#`,
					colour: NOTE_COLOURS[staveNote.name]
				};
			}

			return {
				...n,
				frequency: staveNote.frequency,
				noteName: `${staveNote.name}`,
				colour: NOTE_COLOURS[staveNote.name]
			};
		});
	}

	if (staffMode === 'three-line') {
		const zoneNotes = threeLineZoneNotes(key, chordType);
		return notes.map((n) => {
			const resolved = zoneNotes[n.pitchZone];
			return {
				...n,
				frequency: resolved.frequency,
				noteName: resolved.noteName,
				colour: resolved.colour
			};
		});
	}

	// one-line
	const zoneNotes = oneLineZoneNotes(key, interval);
	return notes.map((n) => {
		const zone = n.pitchZone as 'low' | 'high';
		const resolved = zoneNotes[zone] ?? zoneNotes.low;
		return {
			...n,
			frequency: resolved.frequency,
			noteName: resolved.noteName,
			colour: resolved.colour
		};
	});
}

/** Default composer settings */
export const DEFAULT_COMPOSER_SETTINGS: ComposerSettings = {
	staffMode: 'full',
	playOnPlace: true,
	bpm: 100,
	selectedDuration: 'quarter',
	rootNote: 'C',
	chordType: 'major',
	interval: 'perfect-5th',
	showNoteLabels: true,
	notesPerLine: 4
};

const COMPOSER_SETTINGS_KEY = 'piano_composer_settings';

/** Load composer settings from localStorage */
export function loadComposerSettings(): ComposerSettings {
	try {
		const stored = localStorage.getItem(COMPOSER_SETTINGS_KEY);
		if (stored) {
			return { ...DEFAULT_COMPOSER_SETTINGS, ...JSON.parse(stored) };
		}
	} catch {
		// Corrupted storage - use defaults
	}
	return { ...DEFAULT_COMPOSER_SETTINGS };
}

/** Persist composer settings to localStorage */
export function saveComposerSettings(settings: ComposerSettings): void {
	try {
		localStorage.setItem(COMPOSER_SETTINGS_KEY, JSON.stringify(settings));
	} catch {
		// Storage full or unavailable
	}
}

/**
 * Treble clef SVG path - G clef glyph from a Unicode reference font.
 * Used by ComposerStaff.svelte.
 */
export const TREBLE_CLEF_PATH =
	'M 57.9375 421.875 Q 50.3438 421.875 44.7188 418.2188 Q 39.0938 414.5625 36.2812 407.6719 ' +
	'Q 33.4688 400.7812 33.4688 393.75 Q 33.4688 387.2812 35.7188 381.7969 ' +
	'Q 37.9688 376.3125 42.75 373.2188 Q 47.5312 370.125 53.7188 370.125 ' +
	'Q 59.625 370.4062 63.8438 372.5156 Q 68.0625 374.625 70.7344 378.7031 ' +
	'Q 73.4062 382.7812 73.4062 389.8125 Q 73.4062 397.125 70.7344 401.2031 ' +
	'Q 68.0625 405.2812 64.2656 407.3906 Q 60.4688 409.5 54.8438 409.5 ' +
	'Q 52.0312 409.5 50.0625 408.6562 Q 48.0938 407.8125 45.8438 405.5625 ' +
	'Q 46.9688 409.7812 50.2031 412.1719 Q 53.4375 414.5625 57.9375 414.5625 ' +
	'Q 65.3906 414.5625 71.0859 409.6406 Q 76.7812 404.7188 80.3672 391.5 ' +
	'Q 83.9531 378.2812 84.7969 360 L 81 360 ' +
	'Q 60.1875 360 46.4062 355.7812 Q 32.625 351.5625 24.1875 339.4688 ' +
	'Q 15.75 327.375 15.75 309.9375 Q 15.75 296.4375 20.8125 279 ' +
	'Q 27 264.375 36.2812 252 Q 45.5625 239.625 59.625 226.6875 ' +
	'L 67.9219 217.9688 L 64.125 204.1875 ' +
	'Q 57.9375 182.25 55.9688 172.9688 Q 54 163.6875 54 157.5 ' +
	'Q 54 149.625 56.5312 139.2188 Q 59.0625 128.8125 66.9375 124.0312 ' +
	'Q 74.8125 119.25 80.4375 119.25 Q 87.1875 119.25 93.6562 125.1562 ' +
	'Q 100.125 131.0625 103.2188 142.5938 Q 106.3125 154.125 106.3125 165.375 ' +
	'Q 106.3125 174.375 104.625 184.7812 Q 102.9375 195.1875 98.0156 205.0312 ' +
	'Q 93.0938 214.875 85.7812 223.3125 L 83.5312 225.9844 ' +
	'Q 86.0625 241.1719 88.875 258.75 L 90.8438 272.9531 L 95.0625 272.8125 ' +
	'Q 105.1875 272.8125 113.3438 277.6641 Q 121.5 282.5156 125.4375 292.0078 ' +
	'Q 129.375 301.5 129.375 314.4375 Q 129.375 327.9375 126.2812 336.5156 ' +
	'Q 123.1875 345.0938 115.6641 351 Q 108.1406 356.9062 96.0469 358.875 ' +
	'Q 94.9219 378.8438 90.2812 394.1719 Q 85.6406 409.5 77.4141 415.6875 ' +
	'Q 69.1875 421.875 57.9375 421.875 Z ' +
	'M 80.4375 344.8125 L 84.9375 344.6719 L 84.9375 336.0938 ' +
	'Q 84.9375 327.2344 84.0234 316.3359 Q 83.1094 305.4375 80.8594 288.8438 ' +
	'Q 77.3438 290.25 74.25 293.4141 Q 71.1562 296.5781 69.3281 300.5859 ' +
	'Q 67.5 304.5938 67.5 307.9688 Q 67.5 317.5312 69.6094 323.5781 ' +
	'Q 71.7188 329.625 77.625 335.25 L 73.125 336.9375 ' +
	'Q 67.2188 333.8438 63.7031 330.0469 Q 60.1875 326.25 58.5 320.7656 ' +
	'Q 56.8125 315.2812 56.8125 306.5625 Q 56.8125 300.0938 59.5547 293.625 ' +
	'Q 62.2969 287.1562 66.9375 282.375 Q 71.5781 277.5938 78.8906 275.2031 ' +
	'L 77.0625 264.375 Q 74.5312 249.0469 72.7031 239.4844 ' +
	'Q 63.2812 251.0156 56.8125 260.1562 Q 52.3125 267.1875 48.6562 275.625 ' +
	'Q 45 284.0625 43.875 292.2188 Q 42.75 300.375 42.75 308.8125 ' +
	'Q 42.75 318.9375 46.9688 328.5 Q 51.1875 338.0625 60.1875 341.4375 ' +
	'Q 69.1875 344.8125 80.4375 344.8125 Z ' +
	'M 96.1875 343.125 Q 103.5 340.5938 106.875 336.2344 ' +
	'Q 110.25 331.875 111.6562 326.4609 Q 113.0625 321.0469 113.0625 314.4375 ' +
	'Q 113.0625 307.125 111.0938 300.375 Q 109.125 293.625 104.7656 290.25 ' +
	'Q 100.4062 286.875 92.8125 286.875 L 92.5312 286.875 ' +
	'Q 94.5 302.4844 95.3438 313.9453 Q 96.1875 325.4062 96.1875 334.6875 ' +
	'L 96.1875 343.125 Z ' +
	'M 79.4531 206.4375 Q 86.9062 198.9844 90.7031 192.9375 ' +
	'Q 94.5 186.8906 96.75 179.3672 Q 99 171.8438 99 165.375 ' +
	'Q 99 157.5 97.5938 152.4375 Q 96.1875 147.375 92.8125 143.1562 ' +
	'Q 89.4375 138.9375 84.9375 138.9375 Q 81.5625 139.2188 78.1875 141.6094 ' +
	'Q 74.8125 144 73.2656 147.7969 Q 71.7188 151.5938 71.7188 154.9688 ' +
	'Q 71.7188 159.4688 72.5625 169.7344 Q 73.4062 180 77.625 198.5625 ' +
	'L 79.4531 206.4375 Z';

/** Staff line positions for full stave mode: E4(0), G4(2), B4(4), D5(6), F5(8) */
export const STAFF_LINE_POSITIONS = [0, 2, 4, 6, 8] as const;

/** Staff geometry constants used by ComposerStaff */
export const STAFF_GEOMETRY = {
	lineSpacing: 12,
	bottomLineY: 100,
	staffLeft: 70,
	staffRight: 380
} as const;

/** Y coordinate for a given diatonic staff position */
export function yForStaffPosition(position: number): number {
	return STAFF_GEOMETRY.bottomLineY - position * (STAFF_GEOMETRY.lineSpacing / 2);
}

/** Get display label for a staff mode */
export function staffModeLabel(mode: StaffMode): string {
	switch (mode) {
		case 'full': return 'Full';
		case 'three-line': return '3-Line';
		case 'one-line': return '1-Line';
	}
}
