<script lang="ts">
	import { Play, Square } from 'lucide-svelte';

	interface Props {
		isPlaying: boolean;
		noteCount: number;
		bpm: number;
		onplay: () => void;
		onstop: () => void;
		onbpmchange: (bpm: number) => void;
	}

	let { isPlaying, noteCount, bpm, onplay, onstop, onbpmchange }: Props = $props();

	function handleBpmInput(e: Event) {
		const value = Number((e.target as HTMLInputElement).value);
		if (value >= 40 && value <= 200) {
			onbpmchange(value);
		}
	}
</script>

<div class="flex items-center gap-2">
	<button
		class="play-btn"
		disabled={noteCount === 0 && !isPlaying}
		aria-label={isPlaying ? 'Stop playback' : 'Play sequence'}
		onclick={() => isPlaying ? onstop() : onplay()}
	>
		{#if isPlaying}
			<Square size={14} />
		{:else}
			<Play size={14} />
		{/if}
	</button>

	<label class="bpm-control">
		<span class="bpm-label">BPM</span>
		<input
			type="number"
			class="bpm-input"
			min="40"
			max="200"
			step="5"
			value={bpm}
			oninput={handleBpmInput}
		/>
	</label>

	{#if noteCount > 0}
		<span class="note-badge">{noteCount}</span>
	{/if}
</div>

<style>
	.play-btn {
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

	.play-btn:hover:not(:disabled) {
		background: var(--color-brand-light);
		border-color: var(--color-brand);
		color: var(--color-brand);
	}

	.play-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.bpm-control {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.bpm-label {
		font-size: 0.6875rem;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.bpm-input {
		width: 3.5rem;
		font-size: 0.75rem;
		padding: 0.25rem 0.375rem;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		background: var(--color-surface);
		color: var(--color-text);
		text-align: centre;
	}

	.bpm-input:focus {
		outline: 2px solid var(--color-brand);
		outline-offset: 1px;
	}

	.note-badge {
		font-size: 0.625rem;
		font-weight: 600;
		background: var(--color-surface-secondary);
		color: var(--color-text-secondary);
		padding: 0.125rem 0.375rem;
		border-radius: 9999px;
		min-width: 1.25rem;
		text-align: center;
	}
</style>
