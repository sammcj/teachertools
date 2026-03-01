import type { NoteHandle } from '$lib/types/piano';

// --- Pure utility functions (exported for testing) ---

/** Amplitude for the nth harmonic (1-indexed). Geometric decay. */
export function harmonicAmplitude(n: number): number {
	const amplitudes = [0.4, 0.2, 0.1, 0.05, 0.03, 0.015];
	return amplitudes[n - 1] ?? 0;
}

/** Inharmonic stretch factor — simulates real piano string stiffness. */
export function inharmonicStretch(partial: number): number {
	return partial * (1 + 0.0003 * partial * partial);
}

/** Decay time in seconds, interpolated by frequency. Low notes ring longer. */
export function decayTimeForFrequency(frequency: number): number {
	// C3 (~130 Hz) = 2.0s, B5 (~988 Hz) = 0.5s, linear interpolation clamped
	const t = Math.max(0, Math.min(1, (frequency - 130) / (988 - 130)));
	return 2.0 - t * 1.5;
}

/** Filter cutoff start frequency for the brightness envelope. */
export function filterCutoffForFrequency(
	frequency: number,
	phase: 'attack' | 'sustain'
): number {
	if (phase === 'attack') {
		return Math.min(frequency * 12, 12000);
	}
	return Math.min(frequency * 3, 3000);
}

// --- Shared nodes (created once per AudioContext) ---

const HARMONIC_COUNT = 6;
const NOISE_DURATION = 0.015; // 15ms hammer strike
const NOISE_BANDPASS_FREQ = 4000;
const NOISE_GAIN = 0.08;
const ATTACK = 0.005;
const RELEASE = 0.2;
const FILTER_DECAY = 0.15;
const REVERB_WET = 0.15;

let sharedCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let reverbSend: GainNode | null = null;
let dryGain: GainNode | null = null;

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
	if (noiseBuffer && sharedCtx === ctx) return noiseBuffer;
	const length = Math.ceil(ctx.sampleRate * 0.5);
	const buf = ctx.createBuffer(1, length, ctx.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < length; i++) {
		data[i] = Math.random() * 2 - 1;
	}
	noiseBuffer = buf;
	return buf;
}

function initSharedNodes(ctx: AudioContext): { dry: GainNode; reverb: GainNode } {
	if (sharedCtx === ctx && dryGain && reverbSend) {
		return { dry: dryGain, reverb: reverbSend };
	}
	sharedCtx = ctx;

	// Dry path
	dryGain = ctx.createGain();
	dryGain.gain.value = 1.0;
	dryGain.connect(ctx.destination);

	// Simple reverb: two cross-fed delay lines
	reverbSend = ctx.createGain();
	reverbSend.gain.value = REVERB_WET;

	const delay1 = ctx.createDelay(0.1);
	delay1.delayTime.value = 0.037;
	const fb1 = ctx.createGain();
	fb1.gain.value = 0.15;

	const delay2 = ctx.createDelay(0.1);
	delay2.delayTime.value = 0.053;
	const fb2 = ctx.createGain();
	fb2.gain.value = 0.12;

	// delay1 -> fb1 -> delay2 -> fb2 -> delay1 (cross-fed)
	reverbSend.connect(delay1);
	delay1.connect(fb1);
	fb1.connect(delay2);
	delay2.connect(fb2);
	fb2.connect(delay1);

	// Both delays feed to output
	delay1.connect(ctx.destination);
	delay2.connect(ctx.destination);

	return { dry: dryGain, reverb: reverbSend };
}

/**
 * Start a piano note using additive synthesis with harmonics,
 * hammer noise, filter envelope, and frequency-dependent ADSR.
 */
export function startPianoNote(frequency: number, ctx: AudioContext): NoteHandle {
	const now = ctx.currentTime;
	const { dry, reverb } = initSharedNodes(ctx);
	const decayTime = decayTimeForFrequency(frequency);

	// Voice sum node — all partials and noise feed into this
	const voiceSum = ctx.createGain();
	voiceSum.gain.value = 1.0;

	// --- Harmonic oscillators ---
	const oscillators: OscillatorNode[] = [];
	for (let n = 1; n <= HARMONIC_COUNT; n++) {
		const osc = ctx.createOscillator();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(frequency * inharmonicStretch(n), now);

		const partialGain = ctx.createGain();
		partialGain.gain.value = harmonicAmplitude(n);

		osc.connect(partialGain);
		partialGain.connect(voiceSum);
		osc.start(now);
		oscillators.push(osc);
	}

	// --- Hammer noise burst ---
	const noiseSrc = ctx.createBufferSource();
	noiseSrc.buffer = getNoiseBuffer(ctx);
	const noiseBandpass = ctx.createBiquadFilter();
	noiseBandpass.type = 'bandpass';
	noiseBandpass.frequency.value = NOISE_BANDPASS_FREQ;
	noiseBandpass.Q.value = 2;
	const noiseGain = ctx.createGain();
	noiseGain.gain.setValueAtTime(NOISE_GAIN, now);
	noiseGain.gain.exponentialRampToValueAtTime(0.001, now + NOISE_DURATION);

	noiseSrc.connect(noiseBandpass);
	noiseBandpass.connect(noiseGain);
	noiseGain.connect(voiceSum);
	noiseSrc.start(now);
	noiseSrc.stop(now + NOISE_DURATION + 0.01);

	// --- Lowpass filter with envelope (brightness decay) ---
	const filter = ctx.createBiquadFilter();
	filter.type = 'lowpass';
	filter.Q.value = 1;
	const cutoffStart = filterCutoffForFrequency(frequency, 'attack');
	const cutoffEnd = filterCutoffForFrequency(frequency, 'sustain');
	filter.frequency.setValueAtTime(cutoffStart, now);
	filter.frequency.exponentialRampToValueAtTime(cutoffEnd, now + FILTER_DECAY);

	voiceSum.connect(filter);

	// --- ADSR gain envelope (frequency-dependent decay, no sustain) ---
	const envelope = ctx.createGain();
	envelope.gain.setValueAtTime(0, now);
	envelope.gain.linearRampToValueAtTime(0.5, now + ATTACK);
	envelope.gain.exponentialRampToValueAtTime(0.001, now + ATTACK + decayTime);

	filter.connect(envelope);

	// Connect to both dry and reverb paths
	envelope.connect(dry);
	envelope.connect(reverb);

	// --- Stop function ---
	let stopped = false;
	const stop = () => {
		if (stopped) return;
		stopped = true;
		const t = ctx.currentTime;

		// Release envelope - setTargetAtTime decays smoothly to true zero
		envelope.gain.cancelScheduledValues(t);
		envelope.gain.setValueAtTime(envelope.gain.value, t);
		envelope.gain.setTargetAtTime(0, t, RELEASE / 5);

		// Stop all oscillators after release with buffer
		const stopTime = t + RELEASE + 0.05;
		for (const osc of oscillators) {
			osc.stop(stopTime);
		}
	};

	// Auto-stop when natural decay finishes (piano notes don't sustain indefinitely)
	const autoStopMs = (ATTACK + decayTime + 0.05) * 1000;
	const autoStopTimer = setTimeout(() => {
		if (!stopped) {
			for (const osc of oscillators) {
				try {
					osc.stop();
				} catch {
					// Already stopped
				}
			}
			stopped = true;
		}
	}, autoStopMs);

	return {
		stop: () => {
			clearTimeout(autoStopTimer);
			stop();
		},
		releaseTime: RELEASE,
	};
}
