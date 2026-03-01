import type { ComposedNote, Waveform } from '$lib/types/piano';
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

	const abort = () => {
		aborted = true;
	};

	(async () => {
		ensureAudioContext();

		for (let i = 0; i < notes.length; i++) {
			if (aborted) break;
			onProgress(i);

			const note = notes[i];
			const ms = durationMs(note.duration, bpm);

			// Start the note and schedule its stop after the rhythmic duration
			const handle = startNote(note.frequency, waveform);

			// Wait exactly the rhythmic duration before starting the next note
			await new Promise<void>((resolve) => setTimeout(resolve, ms));

			// Stop with release envelope (tail overlaps next note naturally)
			stopNote(handle);

			if (aborted) break;
		}

		onComplete();
	})();

	return abort;
}
