<script lang="ts">
	import { untrack } from 'svelte';
	import type {
		ComposedNote,
		ComposerKey,
		ComposerSettings,
		ChordType,
		IntervalType,
		StaffMode,
		NoteDuration,
		Waveform,
		NoteDefinition
	} from '$lib/types/piano';
	import type { ResolvedPitch, ResolvedNote } from '$lib/utils/composer-data';
	import {
		DEFAULT_COMPOSER_SETTINGS,
		loadComposerSettings,
		saveComposerSettings,
		staffModeLabel,
		durationMs,
		shiftPitch,
		resolveNoteToStaffPitch,
		remapNotes,
		threeLineZoneNotes,
		oneLineZoneNotes,
		INTERVAL_LABELS
	} from '$lib/utils/composer-data';
	import { NOTE_COLOURS } from '$lib/utils/piano-data';
	import { playNoteForDuration, ensureAudioContext } from '$lib/utils/audio';
	import { playSequence } from '$lib/utils/playback';
	import ComposerStaff from './ComposerStaff.svelte';
	import DurationPicker from './DurationPicker.svelte';
	import PlaybackControls from './PlaybackControls.svelte';
	import Button from '$lib/components/shared/Button.svelte';
	import { Trash2, Volume2, VolumeX, Type } from 'lucide-svelte';

	interface Props {
		waveform: Waveform;
		showColours: boolean;
		soundEnabled: boolean;
		pianoNoteEvent?: { note: NoteDefinition } | null;
	}

	let { waveform, showColours, soundEnabled, pianoNoteEvent = null }: Props = $props();

	let composerSettings = $state<ComposerSettings>(loadComposerSettings());

	// Per-mode note storage: switching modes preserves notes
	let notesByMode = $state<Record<StaffMode, ComposedNote[]>>({
		full: [], 'three-line': [], 'one-line': []
	});
	let composedNotes = $derived(notesByMode[composerSettings.staffMode]);

	let selectedNoteId = $state<string | null>(null);
	let isPlaying = $state(false);
	let currentPlaybackIndex = $state(-1);
	let abortPlayback: (() => void) | null = null;

	const staffModes: StaffMode[] = ['full', 'three-line', 'one-line'];
	const composerKeys: ComposerKey[] = ['C', 'G', 'D', 'A', 'E', 'B'];
	const chordTypes: ChordType[] = ['major', 'minor'];
	const intervalTypes: IntervalType[] = ['minor-3rd', 'major-3rd', 'perfect-4th', 'perfect-5th', 'octave'];

	// Derived zone notes for simplified modes
	let currentThreeLineNotes = $derived(threeLineZoneNotes(composerSettings.rootNote, composerSettings.chordType));
	let currentOneLineNotes = $derived(oneLineZoneNotes(composerSettings.rootNote, composerSettings.interval));

	// One-line zone overrides: when teacher presses a piano key on a selected note,
	// all notes in that zone change to the pressed key (and future placements use it)
	let oneLineZoneOverrides = $state<{ low: ResolvedNote | null; high: ResolvedNote | null }>({
		low: null, high: null
	});

	// Effective one-line notes: overrides take priority over computed values
	let effectiveOneLineNotes = $derived.by(() => {
		const base = oneLineZoneNotes(composerSettings.rootNote, composerSettings.interval);
		return {
			low: oneLineZoneOverrides.low ?? base.low,
			high: oneLineZoneOverrides.high ?? base.high
		};
	});

	function persistSettings() {
		saveComposerSettings(composerSettings);
	}

	function currentMode(): StaffMode {
		return composerSettings.staffMode;
	}

	function updateCurrentModeNotes(notes: ComposedNote[]) {
		notesByMode = { ...notesByMode, [currentMode()]: notes };
	}

	function setStaffMode(mode: StaffMode) {
		if (mode === composerSettings.staffMode) return;
		selectedNoteId = null;
		composerSettings = { ...composerSettings, staffMode: mode };
		persistSettings();
	}

	function setRootNote(key: ComposerKey) {
		if (key === composerSettings.rootNote) return;
		composerSettings = { ...composerSettings, rootNote: key };
		persistSettings();
		oneLineZoneOverrides = { low: null, high: null };
		remapCurrentNotes();
	}

	function setChordType(chord: ChordType) {
		if (chord === composerSettings.chordType) return;
		composerSettings = { ...composerSettings, chordType: chord };
		persistSettings();
		remapCurrentNotes();
	}

	function setInterval(interval: IntervalType) {
		if (interval === composerSettings.interval) return;
		composerSettings = { ...composerSettings, interval };
		persistSettings();
		oneLineZoneOverrides = { low: null, high: null };
		remapCurrentNotes();
	}

	function remapCurrentNotes() {
		const mode = currentMode();
		const current = notesByMode[mode];
		if (current.length === 0) return;
		const remapped = remapNotes(
			current,
			mode,
			composerSettings.rootNote,
			composerSettings.chordType,
			composerSettings.interval
		);
		notesByMode = { ...notesByMode, [mode]: remapped };
	}

	function setDuration(duration: NoteDuration) {
		// If a note is selected, change its duration
		if (selectedNoteId) {
			updateCurrentModeNotes(
				composedNotes.map((n) =>
					n.id === selectedNoteId ? { ...n, duration } : n
				)
			);
		}
		// Always update the selected duration for future placements
		composerSettings = { ...composerSettings, selectedDuration: duration };
		persistSettings();
	}

	function setNotesPerLine(count: number) {
		composerSettings = { ...composerSettings, notesPerLine: count };
		persistSettings();
	}

	function togglePlayOnPlace() {
		composerSettings = { ...composerSettings, playOnPlace: !composerSettings.playOnPlace };
		persistSettings();
	}

	function toggleNoteLabels() {
		composerSettings = { ...composerSettings, showNoteLabels: !composerSettings.showNoteLabels };
		persistSettings();
	}

	function setBpm(bpm: number) {
		composerSettings = { ...composerSettings, bpm };
		persistSettings();
	}

	function handleNotePlace(resolved: ResolvedPitch) {
		const note: ComposedNote = {
			id: crypto.randomUUID(),
			staffPosition: resolved.staffPosition,
			pitchZone: resolved.pitchZone,
			frequency: resolved.frequency,
			noteName: resolved.noteName,
			colour: resolved.colour,
			duration: composerSettings.selectedDuration
		};
		updateCurrentModeNotes([...composedNotes, note]);

		if (composerSettings.playOnPlace && soundEnabled) {
			ensureAudioContext();
			const ms = durationMs(note.duration, composerSettings.bpm);
			playNoteForDuration(note.frequency, waveform, Math.min(ms, 500));
		}
	}

	function handleNoteSelect(id: string | null) {
		selectedNoteId = id;
	}

	function deleteSelected() {
		if (!selectedNoteId) return;
		updateCurrentModeNotes(composedNotes.filter((n) => n.id !== selectedNoteId));
		selectedNoteId = null;
	}

	function clearAll() {
		if (composedNotes.length === 0) return;
		if (!confirm('Clear all notes?')) return;
		updateCurrentModeNotes([]);
		selectedNoteId = null;
	}

	function handlePlay() {
		if (composedNotes.length === 0 || isPlaying) return;
		isPlaying = true;
		ensureAudioContext();
		abortPlayback = playSequence(
			composedNotes,
			composerSettings.bpm,
			waveform,
			(index) => { currentPlaybackIndex = index; },
			() => {
				isPlaying = false;
				currentPlaybackIndex = -1;
				abortPlayback = null;
			}
		);
	}

	function handleStop() {
		if (abortPlayback) {
			abortPlayback();
			abortPlayback = null;
		}
		isPlaying = false;
		currentPlaybackIndex = -1;
	}

	function changeSelectedPitch(direction: 1 | -1) {
		if (!selectedNoteId) return;
		const noteIndex = composedNotes.findIndex((n) => n.id === selectedNoteId);
		if (noteIndex === -1) return;
		const note = composedNotes[noteIndex];
		const newPitch = shiftPitch(
			composerSettings.staffMode,
			note.staffPosition,
			note.pitchZone,
			direction,
			composerSettings.rootNote,
			currentThreeLineNotes,
			effectiveOneLineNotes
		);
		if (!newPitch) return;

		updateCurrentModeNotes(composedNotes.map((n, i) =>
			i === noteIndex
				? {
						...n,
						staffPosition: newPitch.staffPosition,
						pitchZone: newPitch.pitchZone,
						frequency: newPitch.frequency,
						noteName: newPitch.noteName,
						colour: newPitch.colour
					}
				: n
		));

		if (composerSettings.playOnPlace && soundEnabled) {
			ensureAudioContext();
			playNoteForDuration(newPitch.frequency, waveform, 200);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Delete' || e.key === 'Backspace') {
			if (selectedNoteId) {
				e.preventDefault();
				deleteSelected();
			}
		}
		if (e.key === 'Escape') {
			selectedNoteId = null;
		}
		if (e.key === 'ArrowUp' && selectedNoteId) {
			e.preventDefault();
			changeSelectedPitch(1);
		}
		if (e.key === 'ArrowDown' && selectedNoteId) {
			e.preventDefault();
			changeSelectedPitch(-1);
		}
	}

	// When a piano key is played while a note is selected, update its pitch.
	// For one-line mode: updates ALL notes in the same zone and overrides
	// that zone for future placements.
	function applyPianoNoteToSelected(pianoNote: NoteDefinition) {
		if (!selectedNoteId) return;

		const noteIdx = composedNotes.findIndex((n) => n.id === selectedNoteId);
		if (noteIdx === -1) return;

		// One-line mode: override the entire zone
		if (composerSettings.staffMode === 'one-line') {
			const selectedNote = composedNotes[noteIdx];
			const zone = selectedNote.pitchZone as 'low' | 'high';
			const noteName = pianoNote.accidental === '#'
				? `${pianoNote.name}#`
				: pianoNote.name;
			const resolved: ResolvedNote = {
				frequency: pianoNote.frequency,
				noteName,
				colour: NOTE_COLOURS[pianoNote.name]
			};

			// Store override for future placements
			oneLineZoneOverrides = { ...oneLineZoneOverrides, [zone]: resolved };

			// Update all notes in this zone
			updateCurrentModeNotes(composedNotes.map((n) =>
				n.pitchZone === zone
					? { ...n, frequency: resolved.frequency, noteName: resolved.noteName, colour: resolved.colour }
					: n
			));
			return;
		}

		const resolved = resolveNoteToStaffPitch(
			composerSettings.staffMode,
			pianoNote,
			composerSettings.rootNote,
			currentThreeLineNotes,
			effectiveOneLineNotes
		);
		if (!resolved) return;

		updateCurrentModeNotes(composedNotes.map((n, i) =>
			i === noteIdx
				? {
						...n,
						staffPosition: resolved.staffPosition,
						pitchZone: resolved.pitchZone,
						frequency: resolved.frequency,
						noteName: resolved.noteName,
						colour: resolved.colour
					}
				: n
		));
	}

	let lastHandledPianoEvent: typeof pianoNoteEvent = null;

	$effect(() => {
		if (!pianoNoteEvent || pianoNoteEvent === lastHandledPianoEvent) return;
		lastHandledPianoEvent = pianoNoteEvent;
		untrack(() => applyPianoNoteToSelected(pianoNoteEvent!.note));
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="composer-wrapper">
	<!-- Toolbar -->
	<div class="composer-toolbar">
		<!-- Staff mode selector -->
		<div class="toolbar-group">
			{#each staffModes as mode}
				<button
					class="mode-btn"
					class:active={composerSettings.staffMode === mode}
					onclick={() => setStaffMode(mode)}
				>
					{staffModeLabel(mode)}
				</button>
			{/each}
		</div>

		<div class="toolbar-separator"></div>

		<!-- Key selector -->
		<div class="toolbar-group">
			{#each composerKeys as key}
				<button
					class="mode-btn"
					class:active={composerSettings.rootNote === key}
					onclick={() => setRootNote(key)}
				>
					{key}
				</button>
			{/each}
		</div>

		<!-- Chord type (three-line only) -->
		{#if composerSettings.staffMode === 'three-line'}
			<div class="toolbar-group">
				{#each chordTypes as chord}
					<button
						class="mode-btn"
						class:active={composerSettings.chordType === chord}
						onclick={() => setChordType(chord)}
					>
						{chord.charAt(0).toUpperCase() + chord.slice(1)}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Interval selector (one-line only) -->
		{#if composerSettings.staffMode === 'one-line'}
			<select
				class="toolbar-select"
				value={composerSettings.interval}
				onchange={(e) => setInterval(e.currentTarget.value as IntervalType)}
			>
				{#each intervalTypes as iv}
					<option value={iv}>{INTERVAL_LABELS[iv]}</option>
				{/each}
			</select>
		{/if}

		<div class="toolbar-separator"></div>

		<!-- Sound on place toggle -->
		<button
			class="icon-btn"
			class:active={composerSettings.playOnPlace}
			aria-label={composerSettings.playOnPlace ? 'Sound on place: on' : 'Sound on place: off'}
			title={composerSettings.playOnPlace ? 'Sound on place: on' : 'Sound on place: off'}
			onclick={togglePlayOnPlace}
		>
			{#if composerSettings.playOnPlace}
				<Volume2 size={14} />
			{:else}
				<VolumeX size={14} />
			{/if}
		</button>

		<!-- Note labels toggle -->
		<button
			class="icon-btn"
			class:active={composerSettings.showNoteLabels}
			aria-label={composerSettings.showNoteLabels ? 'Note labels: on' : 'Note labels: off'}
			title={composerSettings.showNoteLabels ? 'Note labels: on' : 'Note labels: off'}
			onclick={toggleNoteLabels}
		>
			<Type size={14} />
		</button>

		<div class="toolbar-separator"></div>

		<!-- Duration picker -->
		<DurationPicker selected={composerSettings.selectedDuration} onselect={setDuration} />

		<!-- Notes per line -->
		<select
			class="toolbar-select"
			value={composerSettings.notesPerLine}
			onchange={(e) => setNotesPerLine(Number(e.currentTarget.value))}
			aria-label="Notes per line"
			title="Notes per line"
		>
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as count}
				<option value={count}>{count}</option>
			{/each}
			<option value={0}>Unlimited</option>
		</select>

		<div class="toolbar-separator"></div>

		<!-- Playback controls -->
		<PlaybackControls
			{isPlaying}
			noteCount={composedNotes.length}
			bpm={composerSettings.bpm}
			onplay={handlePlay}
			onstop={handleStop}
			onbpmchange={setBpm}
		/>

		<div class="flex-spacer"></div>

		<!-- Contextual hint -->
		<span class="toolbar-hint">
			{#if selectedNoteId}
				{#if composerSettings.staffMode === 'one-line'}
					Play a key to set zone pitch &middot; Delete to remove
				{:else}
					Play a key or &#x2191;&#x2193; to change pitch &middot; Delete to remove
				{/if}
			{:else if composedNotes.length > 0}
				Click a note to select it
			{:else}
				Click the staff to place notes
			{/if}
		</span>

		<!-- Clear button -->
		<Button variant="ghost" size="sm" onclick={clearAll} disabled={composedNotes.length === 0}>
			<Trash2 size={14} />
			Clear
		</Button>
	</div>

	<!-- Staff -->
	<ComposerStaff
		notes={composedNotes}
		staffMode={composerSettings.staffMode}
		selectedDuration={composerSettings.selectedDuration}
		notesPerLine={composerSettings.notesPerLine}
		{selectedNoteId}
		{currentPlaybackIndex}
		{showColours}
		showNoteLabels={composerSettings.showNoteLabels}
		rootNote={composerSettings.rootNote}
		{currentThreeLineNotes}
		currentOneLineNotes={effectiveOneLineNotes}
		onnoteplace={handleNotePlace}
		onnoteselect={handleNoteSelect}
	/>
</div>

<style>
	.composer-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.composer-toolbar {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
		padding: 0.25rem 0;
	}

	.toolbar-group {
		display: flex;
		gap: 1px;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		overflow: hidden;
	}

	.mode-btn {
		padding: 0.25rem 0.625rem;
		font-size: 0.6875rem;
		font-weight: 500;
		background: var(--color-surface);
		color: var(--color-text-secondary);
		border: none;
		cursor: pointer;
		transition: all 0.15s;
	}

	.mode-btn:hover {
		background: var(--color-surface-secondary);
	}

	.mode-btn.active {
		background: var(--color-brand-light);
		color: var(--color-brand);
	}

	.mode-btn + .mode-btn {
		border-left: 1px solid var(--color-border);
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		background: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 0.15s;
	}

	.icon-btn:hover {
		background: var(--color-surface-secondary);
	}

	.icon-btn.active {
		background: var(--color-brand-light);
		border-color: var(--color-brand);
		color: var(--color-brand);
	}

	.toolbar-separator {
		width: 1px;
		height: 1.5rem;
		background: var(--color-border);
	}

	.toolbar-select {
		padding: 0.25rem 0.5rem;
		font-size: 0.6875rem;
		font-weight: 500;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		background: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.flex-spacer {
		flex: 1;
	}

	.toolbar-hint {
		font-size: 0.6875rem;
		color: var(--color-text-secondary);
		opacity: 0.7;
		white-space: nowrap;
	}
</style>
