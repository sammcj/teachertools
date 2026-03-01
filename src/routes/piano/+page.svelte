<script lang="ts">
	import { onMount } from 'svelte';
	import type { NoteDefinition, NoteHandle, PianoSettings } from '$lib/types/piano';
	import { getNotesForRange, buildKeyToNoteMap, loadSettings, saveSettings } from '$lib/utils/piano-data';
	import { startNote, stopNote, ensureAudioContext } from '$lib/utils/audio';
	import PianoKeyboard from '$lib/components/piano/PianoKeyboard.svelte';
	import SettingsPanel from '$lib/components/piano/SettingsPanel.svelte';
	import StaffComposer from '$lib/components/piano/StaffComposer.svelte';

	let settings = $state<PianoSettings>(loadSettings());
	let activeNotes = $state(new Set<string>());
	let lastActiveNote = $state<NoteDefinition | null>(null);
	let pianoNoteEvent = $state<{ note: NoteDefinition } | null>(null);

	let notes = $derived(getNotesForRange(settings.octaveRange));
	let noteMap = $derived(new Map(notes.map((n) => [n.id, n])));
	let keyToNote = $derived(buildKeyToNoteMap(notes));

	// Active note handles for stopping
	let noteHandles = new Map<string, NoteHandle>();

	function handleNoteStart(noteId: string) {
		if (activeNotes.has(noteId)) return;
		const note = noteMap.get(noteId);
		if (!note) return;

		activeNotes = new Set([...activeNotes, noteId]);
		lastActiveNote = note;
		pianoNoteEvent = { note };

		if (settings.soundEnabled) {
			ensureAudioContext();
			const handle = startNote(note.frequency, settings.waveform);
			noteHandles.set(noteId, handle);
		}
	}

	function handleNoteStop(noteId: string) {
		if (!activeNotes.has(noteId)) return;

		const next = new Set(activeNotes);
		next.delete(noteId);
		activeNotes = next;

		const handle = noteHandles.get(noteId);
		if (handle) {
			stopNote(handle);
			noteHandles.delete(noteId);
		}
	}

	function handleSettingsChange(newSettings: PianoSettings) {
		// If octave range changed, stop all active notes first
		if (newSettings.octaveRange !== settings.octaveRange) {
			for (const noteId of activeNotes) {
				handleNoteStop(noteId);
			}
			lastActiveNote = null;
		}
		settings = newSettings;
		saveSettings(newSettings);
	}

	// Computer keyboard support
	let heldKeys = new Set<string>();

	function handleKeyDown(e: KeyboardEvent) {
		if (e.repeat) return;
		const key = e.key.toLowerCase();
		if (heldKeys.has(key)) return;

		const noteId = keyToNote.get(key);
		if (!noteId) return;

		heldKeys.add(key);
		handleNoteStart(noteId);
	}

	function handleKeyUp(e: KeyboardEvent) {
		const key = e.key.toLowerCase();
		if (!heldKeys.has(key)) return;

		heldKeys.delete(key);
		const noteId = keyToNote.get(key);
		if (noteId) {
			handleNoteStop(noteId);
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			// Clean up any playing notes
			for (const handle of noteHandles.values()) {
				stopNote(handle);
			}
		};
	});
</script>

<svelte:head>
	<title>Piano - Teacher Tools</title>
</svelte:head>

<div class="piano-page mx-auto flex flex-col gap-2 p-2 sm:gap-4 sm:p-4">

	<div class="rounded-xl border border-border bg-surface p-2 sm:p-4">
		<StaffComposer
			waveform={settings.waveform}
			showColours={settings.showColours}
			soundEnabled={settings.soundEnabled}
			activeNote={lastActiveNote}
			{pianoNoteEvent}
		/>
	</div>

	<div class="rounded-xl border border-border bg-surface p-2 sm:p-4">
		<PianoKeyboard
			{notes}
			{activeNotes}
			showLabels={settings.showLabels}
			showShortcuts={settings.showKeyboardShortcuts}
			showColours={settings.showColours}
			highlightScale={settings.highlightScale}
			onnotestart={handleNoteStart}
			onnotestop={handleNoteStop}
		/>
	</div>

	<SettingsPanel {settings} onchange={handleSettingsChange} />
</div>

<style>
	.piano-page {
		max-width: 96vw;
		min-height: 90vh;
	}

	@media (min-width: 640px) {
		.piano-page {
			max-width: 85vw;
		}
	}
</style>
