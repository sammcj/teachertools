<script lang="ts">
	import type { NoteDefinition, ScaleHighlight } from '$lib/types/piano';
	import PianoKey from './PianoKey.svelte';
	import { isInScale } from '$lib/utils/piano-data';

	interface Props {
		notes: NoteDefinition[];
		activeNotes: Set<string>;
		showLabels: boolean;
		showShortcuts: boolean;
		showColours: boolean;
		highlightScale: ScaleHighlight;
		onnotestart: (noteId: string) => void;
		onnotestop: (noteId: string) => void;
	}

	let {
		notes,
		activeNotes,
		showLabels,
		showShortcuts,
		showColours,
		highlightScale,
		onnotestart,
		onnotestop
	}: Props = $props();

	let whiteNotes = $derived(notes.filter((n) => !n.isBlack));
	let blackNotes = $derived(notes.filter((n) => n.isBlack));

	// Track which note a pointer is currently over (for glissando)
	let pointerNoteMap = new Map<number, string>();

	function getNoteIdFromElement(el: Element | null): string | null {
		if (!el) return null;
		const btn = el.closest('[data-note-id]');
		return btn?.getAttribute('data-note-id') ?? null;
	}

	function handlePointerDown(e: PointerEvent) {
		const noteId = getNoteIdFromElement(e.target as Element);
		if (!noteId) return;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		pointerNoteMap.set(e.pointerId, noteId);
		onnotestart(noteId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!pointerNoteMap.has(e.pointerId)) return;
		const el = document.elementFromPoint(e.clientX, e.clientY);
		const noteId = getNoteIdFromElement(el);
		const prevId = pointerNoteMap.get(e.pointerId)!;
		if (noteId && noteId !== prevId) {
			onnotestop(prevId);
			pointerNoteMap.set(e.pointerId, noteId);
			onnotestart(noteId);
		}
	}

	function handlePointerUp(e: PointerEvent) {
		const noteId = pointerNoteMap.get(e.pointerId);
		if (noteId) {
			onnotestop(noteId);
			pointerNoteMap.delete(e.pointerId);
		}
	}

	function handlePointerLeave(e: PointerEvent) {
		handlePointerUp(e);
	}

	/** Calculate the left offset for a black key relative to the white keys container */
	function blackKeyLeft(note: NoteDefinition): string {
		// Find the index of the white key just before this black key
		const whiteIndex = whiteNotes.findIndex(
			(w) => w.octave === note.octave && w.name === note.name
		);
		if (whiteIndex === -1) return '0';
		const whiteCount = whiteNotes.length;
		const pct = ((whiteIndex + 1) / whiteCount) * 100;
		// Centre the black key on the boundary between white keys
		return `calc(${pct}% - 0.875rem)`;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="keyboard-container"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointerleave={handlePointerLeave}
>
	<!-- White keys -->
	{#each whiteNotes as note (note.id)}
		<PianoKey
			{note}
			isActive={activeNotes.has(note.id)}
			showLabel={showLabels}
			showShortcut={showShortcuts}
			showColour={showColours}
			dimmed={highlightScale !== 'none' && !isInScale(note, highlightScale)}
		/>
	{/each}

	<!-- Black keys (absolute positioned) -->
	{#each blackNotes as note (note.id)}
		<div class="black-key-wrapper" style:left={blackKeyLeft(note)}>
			<PianoKey
				{note}
				isActive={activeNotes.has(note.id)}
				showLabel={showLabels}
				showShortcut={showShortcuts}
				showColour={showColours}
				dimmed={highlightScale !== 'none' && !isInScale(note, highlightScale)}
			/>
		</div>
	{/each}
</div>

<style>
	.keyboard-container {
		position: relative;
		display: flex;
		max-width: 100%;
		margin: 0 auto;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.black-key-wrapper {
		position: absolute;
		top: 0;
		z-index: 2;
	}
</style>
