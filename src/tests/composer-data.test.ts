import { describe, it, expect } from 'vitest';
import {
	DURATION_BEATS,
	durationMs,
	resolveFullStavePitch,
	resolveThreeLinePitch,
	resolveOneLinePitch,
	shiftPitch,
	DEFAULT_COMPOSER_SETTINGS,
	STAFF_GEOMETRY,
	yForStaffPosition,
	staffModeLabel,
	TREBLE_CLEF_PATH
} from '$lib/utils/composer-data';

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

describe('resolveFullStavePitch', () => {
	const { bottomLineY, lineSpacing } = STAFF_GEOMETRY;

	it('click at bottom line Y resolves to E4 (position 0)', () => {
		const result = resolveFullStavePitch(bottomLineY, bottomLineY, lineSpacing);
		expect(result).not.toBeNull();
		expect(result!.staffPosition).toBe(0);
		expect(result!.noteName).toBe('E4');
	});

	it('click one line spacing above resolves to G4 (position 2)', () => {
		const y = bottomLineY - lineSpacing;
		const result = resolveFullStavePitch(y, bottomLineY, lineSpacing);
		expect(result).not.toBeNull();
		expect(result!.staffPosition).toBe(2);
		expect(result!.noteName).toBe('G4');
	});

	it('click at half-space above bottom line resolves to F4 (position 1)', () => {
		const y = bottomLineY - lineSpacing / 2;
		const result = resolveFullStavePitch(y, bottomLineY, lineSpacing);
		expect(result).not.toBeNull();
		expect(result!.staffPosition).toBe(1);
		expect(result!.noteName).toBe('F4');
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
});

describe('shiftPitch', () => {
	describe('full stave mode', () => {
		it('shifts E4 (position 0) up to F4 (position 1)', () => {
			const result = shiftPitch('full', 0, 'low', 1);
			expect(result).not.toBeNull();
			expect(result!.staffPosition).toBe(1);
			expect(result!.noteName).toBe('F4');
		});

		it('shifts F4 (position 1) down to E4 (position 0)', () => {
			const result = shiftPitch('full', 1, 'low', -1);
			expect(result).not.toBeNull();
			expect(result!.staffPosition).toBe(0);
			expect(result!.noteName).toBe('E4');
		});

		it('returns null when shifting below C4 (position -2)', () => {
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
	});
});

describe('DEFAULT_COMPOSER_SETTINGS', () => {
	it('has expected defaults', () => {
		expect(DEFAULT_COMPOSER_SETTINGS.staffMode).toBe('full');
		expect(DEFAULT_COMPOSER_SETTINGS.playOnPlace).toBe(true);
		expect(DEFAULT_COMPOSER_SETTINGS.bpm).toBe(100);
		expect(DEFAULT_COMPOSER_SETTINGS.selectedDuration).toBe('quarter');
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
