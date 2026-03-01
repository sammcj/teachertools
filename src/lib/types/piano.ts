export type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type Accidental = '' | '#';
export type Waveform = 'piano' | 'sine' | 'triangle' | 'square';
export type OctaveRange = 1 | 2 | 3;
export type ScaleHighlight = 'none' | 'c-major' | 'g-major' | 'f-major' | 'a-minor';

export interface NoteDefinition {
	id: string;
	name: NoteName;
	octave: number;
	accidental: Accidental;
	frequency: number;
	staffPosition: number;
	isBlack: boolean;
	colour: string;
	keyboardKey?: string;
}

export interface PianoSettings {
	showLabels: boolean;
	showKeyboardShortcuts: boolean;
	showColours: boolean;
	showStaff: boolean;
	soundEnabled: boolean;
	waveform: Waveform;
	octaveRange: OctaveRange;
	highlightScale: ScaleHighlight;
}

export interface NoteHandle {
	stop: () => void;
	releaseTime: number;
}

// Staff composer types
export type StaffMode = 'full' | 'three-line' | 'one-line';
export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth';
export type PitchZone = 'low' | 'middle' | 'high';
export type ComposerKey = 'C' | 'G' | 'D' | 'A' | 'E' | 'B';
export type ChordType = 'major' | 'minor';
export type IntervalType = 'minor-3rd' | 'major-3rd' | 'perfect-4th' | 'perfect-5th' | 'octave';

export interface ComposedNote {
	id: string;
	staffPosition: number;
	pitchZone: PitchZone;
	frequency: number;
	noteName: string;
	colour: string;
	duration: NoteDuration;
}

export interface ComposerSettings {
	staffMode: StaffMode;
	playOnPlace: boolean;
	bpm: number;
	selectedDuration: NoteDuration;
	rootNote: ComposerKey;
	chordType: ChordType;
	interval: IntervalType;
	showNoteLabels: boolean;
	notesPerLine: number;
}
