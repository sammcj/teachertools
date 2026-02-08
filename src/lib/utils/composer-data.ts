import type { ComposerSettings, NoteDuration, PitchZone, StaffMode } from '$lib/types/piano';
import { buildNotes, NOTE_COLOURS } from '$lib/utils/piano-data';

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

/** Three-line mode pitch mapping: low=C4, middle=E4, high=G4 */
const THREE_LINE_NOTES = {
	low: FULL_STAVE_NOTES.find((n) => n.id === 'C4')!,
	middle: FULL_STAVE_NOTES.find((n) => n.id === 'E4')!,
	high: FULL_STAVE_NOTES.find((n) => n.id === 'G4')!
};

/** One-line mode pitch mapping: low=C4, high=G4 */
const ONE_LINE_NOTES = {
	low: FULL_STAVE_NOTES.find((n) => n.id === 'C4')!,
	high: FULL_STAVE_NOTES.find((n) => n.id === 'G4')!
};

export interface ResolvedPitch {
	staffPosition: number;
	pitchZone: PitchZone;
	frequency: number;
	noteName: string;
	colour: string;
}

/**
 * Resolve a click Y position to a diatonic staff position on a full 5-line stave.
 * Returns null if the click is too far outside the staff range.
 */
export function resolveFullStavePitch(
	clickY: number,
	bottomLineY: number,
	lineSpacing: number
): ResolvedPitch | null {
	// Staff position = (bottomLineY - clickY) / (lineSpacing / 2), rounded to nearest integer
	const halfSpace = lineSpacing / 2;
	const rawPosition = (bottomLineY - clickY) / halfSpace;
	const snapped = Math.round(rawPosition);

	// Allow range from C4 (position -2) to G5 (position 12)
	if (snapped < -2 || snapped > 12) return null;

	const note = FULL_STAVE_NOTES.find((n) => n.staffPosition === snapped);
	if (!note) return null;

	const zone: PitchZone = snapped <= 2 ? 'low' : snapped <= 6 ? 'middle' : 'high';

	return {
		staffPosition: snapped,
		pitchZone: zone,
		frequency: note.frequency,
		noteName: `${note.name}${note.octave}`,
		colour: NOTE_COLOURS[note.name]
	};
}

/**
 * Resolve a click Y to the nearest of 3 lines (low/middle/high).
 */
export function resolveThreeLinePitch(
	clickY: number,
	lineYs: { low: number; middle: number; high: number }
): ResolvedPitch {
	const distances = {
		low: Math.abs(clickY - lineYs.low),
		middle: Math.abs(clickY - lineYs.middle),
		high: Math.abs(clickY - lineYs.high)
	};

	let nearest: PitchZone = 'low';
	if (distances.middle < distances[nearest]) nearest = 'middle';
	if (distances.high < distances[nearest]) nearest = 'high';

	const note = THREE_LINE_NOTES[nearest];
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
 */
export function resolveOneLinePitch(
	clickY: number,
	lineY: number
): ResolvedPitch {
	const zone: PitchZone = clickY < lineY ? 'high' : 'low';
	const note = ONE_LINE_NOTES[zone];
	return {
		staffPosition: zone === 'low' ? 0 : 1,
		pitchZone: zone,
		frequency: note.frequency,
		noteName: zone === 'high' ? 'High' : 'Low',
		colour: NOTE_COLOURS[note.name]
	};
}

/** Default composer settings */
export const DEFAULT_COMPOSER_SETTINGS: ComposerSettings = {
	staffMode: 'full',
	playOnPlace: true,
	bpm: 100,
	selectedDuration: 'quarter'
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
 * Treble clef SVG path - derived from the Bravura/SMuFL standard G clef glyph.
 * Used by ComposerStaff.svelte.
 */
export const TREBLE_CLEF_PATH =
	'M 12.8 46.8 C 12.8 49.2 11.2 51.2 8.8 51.2 C 6.4 51.2 4.8 49.6 4.8 47.2 ' +
	'C 4.8 44.8 6.4 43.2 8.8 43.2 C 9.2 43.2 9.6 43.2 10 43.4 L 10 40 ' +
	'C 10 36.8 8.4 34 5.6 32 C 2.8 30 0.8 27.2 0.8 23.6 C 0.8 18.4 4 14 8.8 12 ' +
	'L 10 11.6 L 10 -4 C 10 -8 11.2 -11.2 13.6 -13.6 C 15.6 -15.6 18 -16.8 20.4 -16.8 ' +
	'C 24.4 -16.8 27.2 -14 27.2 -10 C 27.2 -6.8 25.2 -4 22 -2.8 C 18.8 -1.6 15.2 -1.2 12.8 -2 ' +
	'L 12.8 11.2 C 17.2 10.8 21.2 12 24.4 14.4 C 28 17.2 30 21.2 30 25.6 ' +
	'C 30 30 28 33.6 24.8 36 C 21.6 38.4 17.2 39.6 12.8 39.2 Z ' +
	'M 12.8 37.2 C 16.4 37.2 19.6 36 22 34 C 24.8 31.6 26.4 28.4 26.4 25.2 ' +
	'C 26.4 21.6 24.8 18.4 22 16.4 C 19.6 14.4 16.4 13.2 12.8 13.2 Z ' +
	'M 14.4 -2.4 C 16.8 -2 19.2 -2.8 21.2 -4.4 C 23.2 -6 24 -8.4 23.6 -10.8 ' +
	'C 23.2 -13.2 21.2 -14.4 19.2 -14.4 C 17.2 -14.4 15.6 -13.2 14.4 -11.2 ' +
	'C 13.6 -9.6 12.8 -7.2 12.8 -4.8 Z';

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
