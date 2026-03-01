import { describe, it, expect } from 'vitest';
import {
	harmonicAmplitude,
	inharmonicStretch,
	decayTimeForFrequency,
	filterCutoffForFrequency
} from '$lib/utils/audio-synth';

describe('harmonicAmplitude', () => {
	it('returns expected amplitudes for harmonics 1-6', () => {
		expect(harmonicAmplitude(1)).toBe(0.4);
		expect(harmonicAmplitude(2)).toBe(0.2);
		expect(harmonicAmplitude(3)).toBe(0.1);
		expect(harmonicAmplitude(4)).toBe(0.05);
		expect(harmonicAmplitude(5)).toBe(0.03);
		expect(harmonicAmplitude(6)).toBe(0.015);
	});

	it('returns 0 for out-of-range harmonics', () => {
		expect(harmonicAmplitude(0)).toBe(0);
		expect(harmonicAmplitude(7)).toBe(0);
	});
});

describe('inharmonicStretch', () => {
	it('returns the partial unchanged for fundamental', () => {
		expect(inharmonicStretch(1)).toBeCloseTo(1.0003, 4);
	});

	it('increases stretch for higher partials', () => {
		const stretch2 = inharmonicStretch(2);
		const stretch6 = inharmonicStretch(6);
		expect(stretch2).toBeGreaterThan(2);
		expect(stretch6).toBeGreaterThan(6);
		// Higher partials have proportionally more stretch
		expect(stretch6 / 6).toBeGreaterThan(stretch2 / 2);
	});
});

describe('decayTimeForFrequency', () => {
	it('returns ~2.0s for low frequencies (C3 region)', () => {
		expect(decayTimeForFrequency(130)).toBeCloseTo(2.0, 1);
	});

	it('returns ~0.5s for high frequencies (B5 region)', () => {
		expect(decayTimeForFrequency(988)).toBeCloseTo(0.5, 1);
	});

	it('interpolates for middle frequencies', () => {
		const mid = decayTimeForFrequency(559); // roughly middle
		expect(mid).toBeGreaterThan(0.5);
		expect(mid).toBeLessThan(2.0);
	});

	it('clamps for frequencies below C3', () => {
		expect(decayTimeForFrequency(50)).toBe(2.0);
	});

	it('clamps for frequencies above B5', () => {
		expect(decayTimeForFrequency(2000)).toBe(0.5);
	});
});

describe('filterCutoffForFrequency', () => {
	it('returns high cutoff for attack phase', () => {
		const cutoff = filterCutoffForFrequency(440, 'attack');
		expect(cutoff).toBe(440 * 12);
	});

	it('caps attack cutoff at 12000 Hz', () => {
		expect(filterCutoffForFrequency(2000, 'attack')).toBe(12000);
	});

	it('returns lower cutoff for sustain phase', () => {
		const cutoff = filterCutoffForFrequency(440, 'sustain');
		expect(cutoff).toBe(440 * 3);
	});

	it('caps sustain cutoff at 3000 Hz', () => {
		expect(filterCutoffForFrequency(2000, 'sustain')).toBe(3000);
	});
});
