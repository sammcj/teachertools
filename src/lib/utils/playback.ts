import type { ComposedNote, Waveform } from '$lib/types/piano';
import { durationMs } from '$lib/utils/composer-data';
import { playNoteForDuration, ensureAudioContext } from '$lib/utils/audio';

/**
 * Play a sequence of composed notes in order.
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
			await playNoteForDuration(note.frequency, waveform, ms);

			if (aborted) break;
		}

		onComplete();
	})();

	return abort;
}
