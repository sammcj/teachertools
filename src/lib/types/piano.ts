export type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type Accidental = '' | '#';
export type Waveform = 'sine' | 'triangle' | 'square';
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
	oscillator: OscillatorNode;
	gain: GainNode;
}

// Staff composer types
export type StaffMode = 'full' | 'three-line' | 'one-line';
export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth';
export type PitchZone = 'low' | 'middle' | 'high';

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
}
