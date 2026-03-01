<script lang="ts">
	import type { PianoSettings, Waveform, OctaveRange, ScaleHighlight } from '$lib/types/piano';
	import Button from '$lib/components/shared/Button.svelte';
	import { Settings, RotateCcw, ChevronDown, ChevronUp } from 'lucide-svelte';
	import { DEFAULT_SETTINGS } from '$lib/utils/piano-data';

	interface Props {
		settings: PianoSettings;
		onchange: (settings: PianoSettings) => void;
	}

	let { settings, onchange }: Props = $props();
	let open = $state(false);

	function toggle(key: keyof PianoSettings) {
		onchange({ ...settings, [key]: !settings[key] });
	}

	function setWaveform(e: Event) {
		const value = (e.target as HTMLSelectElement).value as Waveform;
		onchange({ ...settings, waveform: value });
	}

	function setOctaveRange(e: Event) {
		const value = Number((e.target as HTMLSelectElement).value) as OctaveRange;
		onchange({ ...settings, octaveRange: value });
	}

	function setScale(e: Event) {
		const value = (e.target as HTMLSelectElement).value as ScaleHighlight;
		onchange({ ...settings, highlightScale: value });
	}

	function resetDefaults() {
		onchange({ ...DEFAULT_SETTINGS });
	}
</script>

<div class="rounded-xl border border-border bg-surface">
	<button
		class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
		onclick={() => (open = !open)}
	>
		<span class="flex items-center gap-2">
			<Settings size={16} />
			Settings
		</span>
		{#if open}
			<ChevronUp size={16} />
		{:else}
			<ChevronDown size={16} />
		{/if}
	</button>

	{#if open}
		<div class="border-t border-border px-4 py-4">
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<!-- Toggles -->
				<label class="setting-row">
					<span class="setting-label">Show note labels</span>
					<input
						type="checkbox"
						class="toggle"
						checked={settings.showLabels}
						onchange={() => toggle('showLabels')}
					/>
				</label>

				<label class="setting-row">
					<span class="setting-label">Show keyboard shortcuts</span>
					<input
						type="checkbox"
						class="toggle"
						checked={settings.showKeyboardShortcuts}
						onchange={() => toggle('showKeyboardShortcuts')}
					/>
				</label>

				<label class="setting-row">
					<span class="setting-label">Show colour coding</span>
					<input
						type="checkbox"
						class="toggle"
						checked={settings.showColours}
						onchange={() => toggle('showColours')}
					/>
				</label>

				<label class="setting-row">
					<span class="setting-label">Show staff notation</span>
					<input
						type="checkbox"
						class="toggle"
						checked={settings.showStaff}
						onchange={() => toggle('showStaff')}
					/>
				</label>

				<label class="setting-row">
					<span class="setting-label">Sound enabled</span>
					<input
						type="checkbox"
						class="toggle"
						checked={settings.soundEnabled}
						onchange={() => toggle('soundEnabled')}
					/>
				</label>

				<!-- Selects -->
				<label class="setting-row">
					<span class="setting-label">Waveform</span>
					<select class="setting-select" value={settings.waveform} onchange={setWaveform}>
						<option value="piano">Piano</option>
						<option value="sine">Sine</option>
						<option value="triangle">Triangle</option>
						<option value="square">Square</option>
					</select>
				</label>

				<label class="setting-row">
					<span class="setting-label">Octave range</span>
					<select class="setting-select" value={settings.octaveRange} onchange={setOctaveRange}>
						<option value={1}>1 octave (C4-B4)</option>
						<option value={2}>2 octaves (C4-B5)</option>
						<option value={3}>3 octaves (C3-B5)</option>
					</select>
				</label>

				<label class="setting-row">
					<span class="setting-label">Highlight scale</span>
					<select class="setting-select" value={settings.highlightScale} onchange={setScale}>
						<option value="none">None</option>
						<option value="c-major">C Major</option>
						<option value="g-major">G Major</option>
						<option value="f-major">F Major</option>
						<option value="a-minor">A Minor</option>
					</select>
				</label>
			</div>

			<div class="mt-4 flex justify-end">
				<Button variant="ghost" size="sm" onclick={resetDefaults}>
					<RotateCcw size={14} />
					Reset to defaults
				</Button>
			</div>
		</div>
	{/if}
</div>

<style>
	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.25rem 0;
	}

	.setting-label {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}

	.toggle {
		width: 2.25rem;
		height: 1.25rem;
		appearance: none;
		-webkit-appearance: none;
		background: var(--color-border-strong);
		border-radius: 9999px;
		position: relative;
		cursor: pointer;
		transition: background-color 0.15s;
		flex-shrink: 0;
	}

	.toggle::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 0.875rem;
		height: 0.875rem;
		background: white;
		border-radius: 50%;
		transition: transform 0.15s;
	}

	.toggle:checked {
		background: var(--color-brand);
	}

	.toggle:checked::after {
		transform: translateX(1rem);
	}

	.setting-select {
		font-size: 0.8125rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		background: var(--color-surface);
		color: var(--color-text);
		cursor: pointer;
		max-width: 10rem;
	}

	.setting-select:focus {
		outline: 2px solid var(--color-brand);
		outline-offset: 1px;
	}
</style>
