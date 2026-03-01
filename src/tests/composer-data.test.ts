import { describe, it, expect } from 'vitest';
import {
	DURATION_BEATS,
	durationMs,
	resolveFullStavePitch,
	resolveThreeLinePitch,
	resolveOneLinePitch,
	shiftPitch,
	resolveNoteToStaffPitch,
	DEFAULT_COMPOSER_SETTINGS,
	STAFF_GEOMETRY,
	yForStaffPosition,
	staffModeLabel,
	TREBLE_CLEF_PATH,
	sharpedNotesForKey,
	keySignaturePositions,
	noteAtInterval,
	threeLineZoneNotes,
	oneLineZoneNotes,
	remapNotes,
	INTERVAL_SEMITONES,
	CHORD_SEMITONES
} from '$lib/utils/composer-data';
import type { ComposedNote } from '$lib/types/piano';
import { buildNotes } from '$lib/utils/piano-data';

describe('DURATION_BEATS', () => {
	it('whole note is 4 beats', () => {
		expect(DURATION_BEATS.whole).toBe(4);
	});

	it('half note is 2 beats', () => {
		expect(DURATION_BEATS.half).toBe(2);
	});

	it('quarter note is 1 beat', () => {
		expect(DURATION_BEATS.quarter).toBe(1);
	});

	it('eighth note is 0.5 beats', () => {
		expect(DURATION_BEATS.eighth).toBe(0.5);
	});
});

describe('durationMs', () => {
	it('quarter note at 120 BPM is 500ms', () => {
		expect(durationMs('quarter', 120)).toBe(500);
	});

	it('whole note at 120 BPM is 2000ms', () => {
		expect(durationMs('whole', 120)).toBe(2000);
	});

	it('half note at 60 BPM is 2000ms', () => {
		expect(durationMs('half', 60)).toBe(2000);
	});

	it('eighth note at 120 BPM is 250ms', () => {
		expect(durationMs('eighth', 120)).toBe(250);
	});

	it('quarter note at 100 BPM is 600ms', () => {
		expect(durationMs('quarter', 100)).toBe(600);
	});
});

describe('yForStaffPosition', () => {
	it('position 0 (E4) returns bottomLineY', () => {
		expect(yForStaffPosition(0)).toBe(STAFF_GEOMETRY.bottomLineY);
	});

	it('position 2 (G4) is one line spacing above bottom', () => {
		expect(yForStaffPosition(2)).toBe(STAFF_GEOMETRY.bottomLineY - STAFF_GEOMETRY.lineSpacing);
	});

	it('position -2 (C4) is one line spacing below bottom', () => {
		expect(yForStaffPosition(-2)).toBe(STAFF_GEOMETRY.bottomLineY + STAFF_GEOMETRY.lineSpacing);
	});

	it('higher positions produce lower Y values', () => {
		expect(yForStaffPosition(8)).toBeLessThan(yForStaffPosition(0));
	});
});

describe('sharpedNotesForKey', () => {
	it('C has no sharps', () => {
		expect(sharpedNotesForKey('C').size).toBe(0);
	});

	it('G has F sharp', () => {
		const sharps = sharpedNotesForKey('G');
		expect(sharps.size).toBe(1);
		expect(sharps.has('F')).toBe(true);
	});

	it('D has F and C sharp', () => {
		const sharps = sharpedNotesForKey('D');
		expect(sharps.size).toBe(2);
		expect(sharps.has('F')).toBe(true);
		expect(sharps.has('C')).toBe(true);
	});

	it('B has F, C, G, D, A sharp', () => {
		const sharps = sharpedNotesForKey('B');
		expect(sharps.size).toBe(5);
		expect(sharps.has('F')).toBe(true);
		expect(sharps.has('C')).toBe(true);
		expect(sharps.has('G')).toBe(true);
		expect(sharps.has('D')).toBe(true);
		expect(sharps.has('A')).toBe(true);
	});
});

describe('keySignaturePositions', () => {
	it('C has no key signature positions', () => {
		expect(keySignaturePositions('C')).toEqual([]);
	});

	it('G has one sharp at position 8 (F)', () => {
		expect(keySignaturePositions('G')).toEqual([8]);
	});

	it('D has two sharps at positions 8 and 5', () => {
		expect(keySignaturePositions('D')).toEqual([8, 5]);
	});

	it('B has five sharp positions', () => {
		expect(keySignaturePositions('B')).toHaveLength(5);
	});
});

describe('noteAtInterval', () => {
	it('C + 0 semitones = C', () => {
		const result = noteAtInterval('C', 0);
		expect(result.noteName).toBe('C');
	});

	it('C + 7 semitones = G', () => {
		const result = noteAtInterval('C', 7);
		expect(result.noteName).toBe('G');
	});

	it('C + 4 semitones = E', () => {
		const result = noteAtInterval('C', 4);
		expect(result.noteName).toBe('E');
	});

	it('D + 4 semitones = F#', () => {
		const result = noteAtInterval('D', 4);
		expect(result.noteName).toBe('F#');
	});

	it('C + 12 semitones = C', () => {
		const result = noteAtInterval('C', 12);
		expect(result.noteName).toBe('C');
	});

	it('returns valid frequency', () => {
		const result = noteAtInterval('C', 0);
		expect(result.frequency).toBeCloseTo(261.63, 0);
	});
});

describe('threeLineZoneNotes', () => {
	it('C major = C/E/G', () => {
		const notes = threeLineZoneNotes('C', 'major');
		expect(notes.low.noteName).toBe('C');
		expect(notes.middle.noteName).toBe('E');
		expect(notes.high.noteName).toBe('G');
	});

	it('C minor = C/D#/G', () => {
		const notes = threeLineZoneNotes('C', 'minor');
		expect(notes.low.noteName).toBe('C');
		expect(notes.middle.noteName).toBe('D#');
		expect(notes.high.noteName).toBe('G');
	});

	it('G major = G/B/D', () => {
		const notes = threeLineZoneNotes('G', 'major');
		expect(notes.low.noteName).toBe('G');
		expect(notes.middle.noteName).toBe('B');
		expect(notes.high.noteName).toBe('D');
	});
});

describe('oneLineZoneNotes', () => {
	it('C perfect-5th = C/G', () => {
		const notes = oneLineZoneNotes('C', 'perfect-5th');
		expect(notes.low.noteName).toBe('C');
		expect(notes.high.noteName).toBe('G');
	});

	it('D octave = D/D', () => {
		const notes = oneLineZoneNotes('D', 'octave');
		expect(notes.low.noteName).toBe('D');
		expect(notes.high.noteName).toBe('D');
	});

	it('C minor-3rd = C/D#', () => {
		const notes = oneLineZoneNotes('C', 'minor-3rd');
		expect(notes.low.noteName).toBe('C');
		expect(notes.high.noteName).toBe('D#');
	});
});

describe('resolveFullStavePitch', () => {
	const { bottomLineY, lineSpacing } = STAFF_GEOMETRY;

	it('click at bottom line Y resolves to E (position 0)', () => {
		const result = resolveFullStavePitch(bottomLineY, bottomLineY, lineSpacing);
		expect(result).not.toBeNull();
		expect(result!.staffPosition).toBe(0);
		expect(result!.noteName).toBe('E');
	});

	it('click one line spacing above resolves to G (position 2)', () => {
		const y = bottomLineY - lineSpacing;
		const result = resolveFullStavePitch(y, bottomLineY, lineSpacing);
		expect(result).not.toBeNull();
		expect(result!.staffPosition).toBe(2);
		expect(result!.noteName).toBe('G');
	});

	it('click at half-space above bottom line resolves to F (position 1)', () => {
		const y = bottomLineY - lineSpacing / 2;
		const result = resolveFullStavePitch(y, bottomLineY, lineSpacing);
		expect(result).not.toBeNull();
		expect(result!.staffPosition).toBe(1);
		expect(result!.noteName).toBe('F');
	});

	it('returns null for positions too far below staff', () => {
		const y = bottomLineY + lineSpacing * 3; // way below
		const result = resolveFullStavePitch(y, bottomLineY, lineSpacing);
		expect(result).toBeNull();
	});

	it('returns null for positions too far above staff', () => {
		const y = bottomLineY - lineSpacing * 10; // way above
		const result = resolveFullStavePitch(y, bottomLineY, lineSpacing);
		expect(result).toBeNull();
	});

	it('resolves a frequency for each valid position', () => {
		const result = resolveFullStavePitch(bottomLineY, bottomLineY, lineSpacing);
		expect(result!.frequency).toBeGreaterThan(0);
	});

	it('assigns pitch zones correctly', () => {
		// E4 (pos 0) should be low
		const low = resolveFullStavePitch(bottomLineY, bottomLineY, lineSpacing);
		expect(low!.pitchZone).toBe('low');

		// B4 (pos 4) should be middle
		const midY = bottomLineY - 2 * lineSpacing;
		const mid = resolveFullStavePitch(midY, bottomLineY, lineSpacing);
		expect(mid!.pitchZone).toBe('middle');

		// F5 (pos 8) should be high
		const highY = bottomLineY - 4 * lineSpacing;
		const high = resolveFullStavePitch(highY, bottomLineY, lineSpacing);
		expect(high!.pitchZone).toBe('high');
	});

	it('applies key signature sharps in G major (F becomes F#)', () => {
		// F4 is at position 1
		const y = bottomLineY - lineSpacing / 2;
		const result = resolveFullStavePitch(y, bottomLineY, lineSpacing, 'G');
		expect(result).not.toBeNull();
		expect(result!.noteName).toBe('F#');
		expect(result!.staffPosition).toBe(1);
	});

	it('does not sharp non-affected notes in G major', () => {
		// E4 at position 0 should remain natural
		const result = resolveFullStavePitch(bottomLineY, bottomLineY, lineSpacing, 'G');
		expect(result!.noteName).toBe('E');
	});

	it('C major has no sharps (backward compatible)', () => {
		const y = bottomLineY - lineSpacing / 2;
		const result = resolveFullStavePitch(y, bottomLineY, lineSpacing, 'C');
		expect(result!.noteName).toBe('F');
	});
});

describe('resolveThreeLinePitch', () => {
	const lineYs = { low: 110, middle: 85, high: 60 };

	it('click near low line resolves to low zone', () => {
		const result = resolveThreeLinePitch(108, lineYs);
		expect(result.pitchZone).toBe('low');
		expect(result.staffPosition).toBe(0);
	});

	it('click near middle line resolves to middle zone', () => {
		const result = resolveThreeLinePitch(83, lineYs);
		expect(result.pitchZone).toBe('middle');
		expect(result.staffPosition).toBe(1);
	});

	it('click near high line resolves to high zone', () => {
		const result = resolveThreeLinePitch(62, lineYs);
		expect(result.pitchZone).toBe('high');
		expect(result.staffPosition).toBe(2);
	});

	it('click between low and middle snaps to nearest', () => {
		// Midpoint is 97.5, so 96 should snap to middle (closer to 85)
		const result = resolveThreeLinePitch(96, lineYs);
		expect(result.pitchZone).toBe('middle');
	});

	it('returns a valid frequency', () => {
		const result = resolveThreeLinePitch(85, lineYs);
		expect(result.frequency).toBeGreaterThan(0);
	});

	it('uses custom zone notes when provided', () => {
		const zoneNotes = threeLineZoneNotes('G', 'major');
		const result = resolveThreeLinePitch(108, lineYs, zoneNotes);
		expect(result.noteName).toBe('G');
		expect(result.pitchZone).toBe('low');
	});
});

describe('resolveOneLinePitch', () => {
	const lineY = 85;

	it('click above line resolves to high', () => {
		const result = resolveOneLinePitch(70, lineY);
		expect(result.pitchZone).toBe('high');
		expect(result.noteName).toBe('High');
	});

	it('click below line resolves to low', () => {
		const result = resolveOneLinePitch(100, lineY);
		expect(result.pitchZone).toBe('low');
		expect(result.noteName).toBe('Low');
	});

	it('click exactly on line resolves to low', () => {
		// clickY === lineY means not less than, so low
		const result = resolveOneLinePitch(lineY, lineY);
		expect(result.pitchZone).toBe('low');
	});

	it('returns valid frequencies for both zones', () => {
		const high = resolveOneLinePitch(70, lineY);
		const low = resolveOneLinePitch(100, lineY);
		expect(high.frequency).toBeGreaterThan(0);
		expect(low.frequency).toBeGreaterThan(0);
		expect(high.frequency).not.toBe(low.frequency);
	});

	it('uses custom zone notes when provided', () => {
		const zoneNotes = oneLineZoneNotes('D', 'octave');
		const result = resolveOneLinePitch(70, lineY, zoneNotes);
		expect(result.noteName).toBe('D');
		expect(result.pitchZone).toBe('high');
	});
});

describe('shiftPitch', () => {
	describe('full stave mode', () => {
		it('shifts E (position 0) up to F (position 1)', () => {
			const result = shiftPitch('full', 0, 'low', 1);
			expect(result).not.toBeNull();
			expect(result!.staffPosition).toBe(1);
			expect(result!.noteName).toBe('F');
		});

		it('shifts F (position 1) down to E (position 0)', () => {
			const result = shiftPitch('full', 1, 'low', -1);
			expect(result).not.toBeNull();
			expect(result!.staffPosition).toBe(0);
			expect(result!.noteName).toBe('E');
		});

		it('returns null when shifting below C (position -2)', () => {
			const result = shiftPitch('full', -2, 'low', -1);
			expect(result).toBeNull();
		});

		it('returns null when shifting above B5 (position 11)', () => {
			const result = shiftPitch('full', 11, 'high', 1);
			expect(result).toBeNull();
		});

		it('updates pitch zone when crossing boundary', () => {
			// Position 2 is low, position 3 is middle
			const result = shiftPitch('full', 2, 'low', 1);
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('middle');
		});

		it('returns a valid frequency', () => {
			const result = shiftPitch('full', 0, 'low', 1);
			expect(result!.frequency).toBeGreaterThan(0);
		});

		it('applies key signature when shifting in G major', () => {
			// Shift from E (pos 0) up to F# (pos 1) in G major
			const result = shiftPitch('full', 0, 'low', 1, 'G');
			expect(result).not.toBeNull();
			expect(result!.noteName).toBe('F#');
		});
	});

	describe('three-line mode', () => {
		it('shifts low up to middle', () => {
			const result = shiftPitch('three-line', 0, 'low', 1);
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('middle');
		});

		it('shifts middle up to high', () => {
			const result = shiftPitch('three-line', 1, 'middle', 1);
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('high');
		});

		it('shifts high down to middle', () => {
			const result = shiftPitch('three-line', 2, 'high', -1);
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('middle');
		});

		it('returns null when shifting above high', () => {
			const result = shiftPitch('three-line', 2, 'high', 1);
			expect(result).toBeNull();
		});

		it('returns null when shifting below low', () => {
			const result = shiftPitch('three-line', 0, 'low', -1);
			expect(result).toBeNull();
		});

		it('uses custom zone notes when provided', () => {
			const zoneNotes = threeLineZoneNotes('G', 'major');
			const result = shiftPitch('three-line', 0, 'low', 1, 'C', zoneNotes);
			expect(result).not.toBeNull();
			expect(result!.noteName).toBe('B');
		});
	});

	describe('one-line mode', () => {
		it('shifts low up to high', () => {
			const result = shiftPitch('one-line', 0, 'low', 1);
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('high');
			expect(result!.noteName).toBe('High');
		});

		it('shifts high down to low', () => {
			const result = shiftPitch('one-line', 1, 'high', -1);
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('low');
			expect(result!.noteName).toBe('Low');
		});

		it('returns null when shifting above high', () => {
			const result = shiftPitch('one-line', 1, 'high', 1);
			expect(result).toBeNull();
		});

		it('returns null when shifting below low', () => {
			const result = shiftPitch('one-line', 0, 'low', -1);
			expect(result).toBeNull();
		});

		it('uses custom zone notes when provided', () => {
			const zoneNotes = oneLineZoneNotes('D', 'octave');
			const result = shiftPitch('one-line', 0, 'low', 1, 'C', undefined, zoneNotes);
			expect(result).not.toBeNull();
			expect(result!.noteName).toBe('D');
		});
	});
});

describe('resolveNoteToStaffPitch', () => {
	const allNotes = buildNotes(3, 5);
	const findNote = (id: string) => allNotes.find((n) => n.id === id)!;

	describe('full stave mode', () => {
		it('maps C4 to staff position -2', () => {
			const result = resolveNoteToStaffPitch('full', findNote('C4'));
			expect(result).not.toBeNull();
			expect(result!.staffPosition).toBe(-2);
			expect(result!.noteName).toBe('C');
		});

		it('maps G4 to staff position 2', () => {
			const result = resolveNoteToStaffPitch('full', findNote('G4'));
			expect(result).not.toBeNull();
			expect(result!.staffPosition).toBe(2);
		});

		it('returns null for sharps', () => {
			const result = resolveNoteToStaffPitch('full', findNote('C#4'));
			expect(result).toBeNull();
		});

		it('returns null for notes outside range', () => {
			const result = resolveNoteToStaffPitch('full', findNote('C3'));
			expect(result).toBeNull();
		});

		it('applies key signature sharps in G major', () => {
			const result = resolveNoteToStaffPitch('full', findNote('F4'), 'G');
			expect(result).not.toBeNull();
			expect(result!.noteName).toBe('F#');
		});
	});

	describe('three-line mode', () => {
		it('maps C4 to low zone', () => {
			const result = resolveNoteToStaffPitch('three-line', findNote('C4'));
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('low');
			expect(result!.noteName).toBe('Low');
		});

		it('maps E4 to middle zone', () => {
			const result = resolveNoteToStaffPitch('three-line', findNote('E4'));
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('middle');
			expect(result!.noteName).toBe('Middle');
		});

		it('maps G4 to high zone', () => {
			const result = resolveNoteToStaffPitch('three-line', findNote('G4'));
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('high');
			expect(result!.noteName).toBe('High');
		});

		it('maps A4 to high zone (nearest to G4)', () => {
			const result = resolveNoteToStaffPitch('three-line', findNote('A4'));
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('high');
		});

		it('maps sharps to nearest zone', () => {
			const result = resolveNoteToStaffPitch('three-line', findNote('C#4'));
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('low');
		});

		it('uses custom zone notes when provided', () => {
			const zoneNotes = threeLineZoneNotes('G', 'major');
			const result = resolveNoteToStaffPitch('three-line', findNote('C4'), 'C', zoneNotes);
			expect(result).not.toBeNull();
			expect(result!.noteName).toBe('G');
		});
	});

	describe('one-line mode', () => {
		it('maps C4 to low zone', () => {
			const result = resolveNoteToStaffPitch('one-line', findNote('C4'));
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('low');
			expect(result!.noteName).toBe('Low');
		});

		it('maps G4 to high zone', () => {
			const result = resolveNoteToStaffPitch('one-line', findNote('G4'));
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('high');
			expect(result!.noteName).toBe('High');
		});

		it('maps E4 to high zone (equidistant, prefers high)', () => {
			const result = resolveNoteToStaffPitch('one-line', findNote('E4'));
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('high');
		});

		it('maps D4 to low zone (closer to C4)', () => {
			const result = resolveNoteToStaffPitch('one-line', findNote('D4'));
			expect(result).not.toBeNull();
			expect(result!.pitchZone).toBe('low');
		});

		it('uses custom zone notes when provided', () => {
			const zoneNotes = oneLineZoneNotes('D', 'octave');
			const result = resolveNoteToStaffPitch('one-line', findNote('G4'), 'C', undefined, zoneNotes);
			expect(result).not.toBeNull();
			expect(result!.noteName).toBe('D');
		});
	});
});

describe('remapNotes', () => {
	function makeNote(overrides: Partial<ComposedNote>): ComposedNote {
		return {
			id: 'test-1',
			staffPosition: 0,
			pitchZone: 'low',
			frequency: 261.63,
			noteName: 'E',
			colour: '#FDD835',
			duration: 'quarter',
			...overrides
		};
	}

	it('full stave C->G remaps F notes to F#', () => {
		const notes = [
			makeNote({ staffPosition: 1, noteName: 'F' }), // F position
			makeNote({ id: 'test-2', staffPosition: 0, noteName: 'E' }) // E position
		];
		const remapped = remapNotes(notes, 'full', 'G', 'major', 'perfect-5th');
		expect(remapped[0].noteName).toBe('F#');
		expect(remapped[1].noteName).toBe('E'); // E unaffected
	});

	it('three-line major->minor changes middle zone', () => {
		const notes = [
			makeNote({ pitchZone: 'middle', noteName: 'E' })
		];
		const remapped = remapNotes(notes, 'three-line', 'C', 'minor', 'perfect-5th');
		expect(remapped[0].noteName).toBe('D#'); // Minor 3rd instead of major
	});

	it('one-line remaps with new interval', () => {
		const notes = [
			makeNote({ pitchZone: 'high', noteName: 'G' })
		];
		const remapped = remapNotes(notes, 'one-line', 'C', 'major', 'octave');
		expect(remapped[0].noteName).toBe('C'); // Octave above C
	});

	it('preserves note id and duration through remap', () => {
		const notes = [makeNote({ id: 'keep-me', duration: 'half' })];
		const remapped = remapNotes(notes, 'full', 'C', 'major', 'perfect-5th');
		expect(remapped[0].id).toBe('keep-me');
		expect(remapped[0].duration).toBe('half');
	});
});

describe('DEFAULT_COMPOSER_SETTINGS', () => {
	it('has expected defaults', () => {
		expect(DEFAULT_COMPOSER_SETTINGS.staffMode).toBe('full');
		expect(DEFAULT_COMPOSER_SETTINGS.playOnPlace).toBe(true);
		expect(DEFAULT_COMPOSER_SETTINGS.bpm).toBe(100);
		expect(DEFAULT_COMPOSER_SETTINGS.selectedDuration).toBe('quarter');
		expect(DEFAULT_COMPOSER_SETTINGS.rootNote).toBe('C');
		expect(DEFAULT_COMPOSER_SETTINGS.chordType).toBe('major');
		expect(DEFAULT_COMPOSER_SETTINGS.interval).toBe('perfect-5th');
		expect(DEFAULT_COMPOSER_SETTINGS.showNoteLabels).toBe(true);
	});
});

describe('staffModeLabel', () => {
	it('returns correct labels', () => {
		expect(staffModeLabel('full')).toBe('Full');
		expect(staffModeLabel('three-line')).toBe('3-Line');
		expect(staffModeLabel('one-line')).toBe('1-Line');
	});
});

describe('TREBLE_CLEF_PATH', () => {
	it('is a non-empty string starting with M', () => {
		expect(TREBLE_CLEF_PATH.length).toBeGreaterThan(0);
		expect(TREBLE_CLEF_PATH.startsWith('M')).toBe(true);
	});
});

describe('INTERVAL_SEMITONES', () => {
	it('has correct semitone values', () => {
		expect(INTERVAL_SEMITONES['minor-3rd']).toBe(3);
		expect(INTERVAL_SEMITONES['major-3rd']).toBe(4);
		expect(INTERVAL_SEMITONES['perfect-4th']).toBe(5);
		expect(INTERVAL_SEMITONES['perfect-5th']).toBe(7);
		expect(INTERVAL_SEMITONES['octave']).toBe(12);
	});
});

describe('CHORD_SEMITONES', () => {
	it('major chord is [4, 7]', () => {
		expect(CHORD_SEMITONES.major).toEqual([4, 7]);
	});

	it('minor chord is [3, 7]', () => {
		expect(CHORD_SEMITONES.minor).toEqual([3, 7]);
	});
});
