import type { NoteHandle, Waveform } from '$lib/types/piano';

let audioCtx: AudioContext | null = null;

/** Lazily create AudioContext on first user interaction (handles iOS Safari autoplay policy) */
export function ensureAudioContext(): AudioContext {
	if (!audioCtx) {
		audioCtx = new AudioContext();
	}
	if (audioCtx.state === 'suspended') {
		audioCtx.resume();
	}
	return audioCtx;
}

/** ADSR envelope parameters */
const ATTACK = 0.02;
const DECAY = 0.1;
const SUSTAIN_LEVEL = 0.2;
const RELEASE = 0.3;

/**
 * Start playing a note. Returns a handle to stop it later.
 * Each call creates a fresh oscillator+gain pair for polyphony.
 */
export function startNote(frequency: number, waveform: Waveform): NoteHandle {
	const ctx = ensureAudioContext();
	const now = ctx.currentTime;

	const oscillator = ctx.createOscillator();
	oscillator.type = waveform;
	oscillator.frequency.setValueAtTime(frequency, now);

	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0, now);
	// Attack
	gain.gain.linearRampToValueAtTime(0.5, now + ATTACK);
	// Decay to sustain
	gain.gain.linearRampToValueAtTime(SUSTAIN_LEVEL, now + ATTACK + DECAY);

	oscillator.connect(gain);
	gain.connect(ctx.destination);
	oscillator.start(now);

	return { oscillator, gain };
}

/**
 * Play a note for a specific duration, then stop with release envelope.
 * Resolves after the release envelope completes.
 */
export function playNoteForDuration(
	frequency: number,
	waveform: Waveform,
	durationMs: number
): Promise<void> {
	const handle = startNote(frequency, waveform);
	return new Promise((resolve) => {
		setTimeout(() => {
			stopNote(handle);
			// Wait for release envelope to finish before resolving
			setTimeout(resolve, RELEASE * 1000 + 20);
		}, durationMs);
	});
}

/** Stop a playing note with release envelope */
export function stopNote(handle: NoteHandle): void {
	const ctx = audioCtx;
	if (!ctx) return;

	const now = ctx.currentTime;
	const { oscillator, gain } = handle;

	// Cancel any scheduled ramps and release
	gain.gain.cancelScheduledValues(now);
	gain.gain.setValueAtTime(gain.gain.value, now);
	gain.gain.exponentialRampToValueAtTime(0.001, now + RELEASE);
	oscillator.stop(now + RELEASE + 0.01);
}
