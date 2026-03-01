import type { ComposedNote, NoteHandle, Waveform } from '$lib/types/piano';
import { durationMs } from '$lib/utils/composer-data';
import { startNote, stopNote, ensureAudioContext } from '$lib/utils/audio';

/**
 * Play a sequence of composed notes in order.
 * Each note starts precisely after the previous note's rhythmic duration,
 * allowing release envelopes to overlap with the next note's attack
 * for natural-sounding timing.
 * Returns an abort function that stops playback immediately.
 */
export function playSequence(
	notes: ComposedNote[],
	bpm: number,
	waveform: Waveform,
	onProgress: (index: number) => void,
	onComplete: () => void
): () => void {
	let aborted = false;
	let currentHandle: NoteHandle | null = null;

	const abort = () => {
		aborted = true;
		if (currentHandle) {
			stopNote(currentHandle);
			currentHandle = null;
		}
	};

	(async () => {
		ensureAudioContext();

		for (let i = 0; i < notes.length; i++) {
			if (aborted) break;
			onProgress(i);

			const note = notes[i];
			const ms = durationMs(note.duration, bpm);

			currentHandle = startNote(note.frequency, waveform);

			// Wait exactly the rhythmic duration before starting the next note
			await new Promise<void>((resolve) => setTimeout(resolve, ms));

			if (aborted) break;

			// Stop with release envelope (tail overlaps next note naturally)
			stopNote(currentHandle);

			// After the last note, wait for the release envelope to fade out
			// so the sound doesn't end abruptly
			if (i === notes.length - 1) {
				const releaseMs = currentHandle.releaseTime * 1000 + 50;
				await new Promise<void>((resolve) => setTimeout(resolve, releaseMs));
			}

			currentHandle = null;
		}

		onComplete();
	})();

	return abort;
}
