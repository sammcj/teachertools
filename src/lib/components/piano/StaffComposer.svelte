<script lang="ts">
	import type { ComposedNote, ComposerSettings, StaffMode, NoteDuration, Waveform, NoteDefinition } from '$lib/types/piano';
	import type { ResolvedPitch } from '$lib/utils/composer-data';
	import {
		DEFAULT_COMPOSER_SETTINGS,
		loadComposerSettings,
		saveComposerSettings,
		staffModeLabel,
		durationMs
	} from '$lib/utils/composer-data';
	import { playNoteForDuration, ensureAudioContext } from '$lib/utils/audio';
	import { playSequence } from '$lib/utils/playback';
	import ComposerStaff from './ComposerStaff.svelte';
	import DurationPicker from './DurationPicker.svelte';
	import PlaybackControls from './PlaybackControls.svelte';
	import Button from '$lib/components/shared/Button.svelte';
	import { Trash2, Volume2, VolumeX } from 'lucide-svelte';

	interface Props {
		waveform: Waveform;
		showColours: boolean;
		soundEnabled: boolean;
		activeNote?: NoteDefinition | null;
	}

	let { waveform, showColours, soundEnabled, activeNote = null }: Props = $props();

	let composerSettings = $state<ComposerSettings>(loadComposerSettings());
	let composedNotes = $state<ComposedNote[]>([]);
	let selectedNoteId = $state<string | null>(null);
	let isPlaying = $state(false);
	let currentPlaybackIndex = $state(-1);
	let abortPlayback: (() => void) | null = null;

	const staffModes: StaffMode[] = ['full', 'three-line', 'one-line'];

	function persistSettings() {
		saveComposerSettings(composerSettings);
	}

	function setStaffMode(mode: StaffMode) {
		if (mode === composerSettings.staffMode) return;
		if (composedNotes.length > 0) {
			// Different pitch systems are incompatible - confirm clearing
			if (!confirm('Changing staff mode will clear all placed notes. Continue?')) return;
			composedNotes = [];
			selectedNoteId = null;
		}
		composerSettings = { ...composerSettings, staffMode: mode };
		persistSettings();
	}

	function setDuration(duration: NoteDuration) {
		composerSettings = { ...composerSettings, selectedDuration: duration };
		persistSettings();
	}

	function togglePlayOnPlace() {
		composerSettings = { ...composerSettings, playOnPlace: !composerSettings.playOnPlace };
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
		composedNotes = [...composedNotes, note];

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
		composedNotes = composedNotes.filter((n) => n.id !== selectedNoteId);
		selectedNoteId = null;
	}

	function clearAll() {
		if (composedNotes.length === 0) return;
		if (!confirm('Clear all notes?')) return;
		composedNotes = [];
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
	}
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

		<div class="toolbar-separator"></div>

		<!-- Duration picker -->
		<DurationPicker selected={composerSettings.selectedDuration} onselect={setDuration} />

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
				Press Delete to remove selected note
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
		{selectedNoteId}
		{currentPlaybackIndex}
		{showColours}
		{activeNote}
		showColour={showColours}
		onnoteplace={handleNotePlace}
		onnoteselect={handleNoteSelect}
	/>
</div>

<style>
	.composer-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.composer-toolbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		padding: 0.375rem 0;
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
