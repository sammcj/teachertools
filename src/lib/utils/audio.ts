import type { NoteHandle, Waveform } from '$lib/types/piano';
import { startPianoNote } from './audio-synth';

let audioCtx: AudioContext | null = null;
let audioUnlocked = false;

/**
 * Lazily create AudioContext on first user interaction.
 * iOS Safari requires creation + resume during a user gesture.
 * Uses webkitAudioContext fallback for older Safari versions.
 */
export function ensureAudioContext(): AudioContext {
	if (!audioCtx) {
		const CtxClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		audioCtx = new CtxClass();
	}
	// iOS Safari suspends the context between user gestures -- resume every time
	if (audioCtx.state === 'suspended') {
		void audioCtx.resume();
	}
	// Play a silent buffer on first interaction to unlock iOS audio
	if (!audioUnlocked && audioCtx.state === 'running') {
		const buf = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
		const src = audioCtx.createBufferSource();
		src.buffer = buf;
		src.connect(audioCtx.destination);
		src.start(0);
		audioUnlocked = true;
	}
	return audioCtx;
}

/** Simple oscillator ADSR envelope parameters */
const ATTACK = 0.02;
const DECAY = 0.1;
const SUSTAIN_LEVEL = 0.2;
const RELEASE = 0.4;

/**
 * Start playing a note. Returns an opaque handle to stop it later.
 * Each call creates fresh audio nodes for polyphony.
 */
export function startNote(frequency: number, waveform: Waveform): NoteHandle {
	const ctx = ensureAudioContext();

	if (waveform === 'piano') {
		return startPianoNote(frequency, ctx);
	}

	const now = ctx.currentTime;

	const oscillator = ctx.createOscillator();
	oscillator.type = waveform;
	oscillator.frequency.setValueAtTime(frequency, now);

	// ADSR envelope gain
	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0, now);
	gain.gain.linearRampToValueAtTime(0.5, now + ATTACK);
	gain.gain.linearRampToValueAtTime(SUSTAIN_LEVEL, now + ATTACK + DECAY);

	// Separate release gain node so we never touch the ADSR automation
	const releaseGain = ctx.createGain();
	releaseGain.gain.value = 1.0;

	oscillator.connect(gain);
	gain.connect(releaseGain);
	releaseGain.connect(ctx.destination);
	oscillator.start(now);

	return {
		stop: () => {
			if (!audioCtx) return;
			const t = audioCtx.currentTime;
			// Fade the release gain to zero without touching ADSR
			releaseGain.gain.setTargetAtTime(0, t, RELEASE / 4);
			oscillator.stop(t + RELEASE * 3);
		},
		releaseTime: RELEASE,
	};
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
			setTimeout(resolve, handle.releaseTime * 1000 + 50);
		}, durationMs);
	});
}

/** Stop a playing note with release envelope */
export function stopNote(handle: NoteHandle): void {
	handle.stop();
}
