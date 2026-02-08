<script lang="ts">
	import type { NoteDuration } from '$lib/types/piano';

	interface Props {
		selected: NoteDuration;
		onselect: (duration: NoteDuration) => void;
	}

	let { selected, onselect }: Props = $props();

	const durations: { value: NoteDuration; label: string; ariaLabel: string }[] = [
		{ value: 'whole', label: '1', ariaLabel: 'Whole note' },
		{ value: 'half', label: '\u00BD', ariaLabel: 'Half note' },
		{ value: 'quarter', label: '\u00BC', ariaLabel: 'Quarter note' },
		{ value: 'eighth', label: '\u215B', ariaLabel: 'Eighth note' }
	];
</script>

<div class="flex items-center gap-1" role="radiogroup" aria-label="Note duration">
	{#each durations as dur}
		<button
			class="duration-btn"
			class:active={selected === dur.value}
			aria-label={dur.ariaLabel}
			aria-checked={selected === dur.value}
			role="radio"
			onclick={() => onselect(dur.value)}
		>
			<!-- Note head icon -->
			<svg viewBox="0 0 20 28" class="duration-icon" aria-hidden="true">
				{#if dur.value === 'whole'}
					<ellipse cx="10" cy="14" rx="7" ry="5" fill="none" stroke="currentColor" stroke-width="1.5" transform="rotate(-15, 10, 14)" />
				{:else if dur.value === 'half'}
					<ellipse cx="8" cy="17" rx="6" ry="4.5" fill="none" stroke="currentColor" stroke-width="1.5" transform="rotate(-15, 8, 17)" />
					<line x1="14" y1="17" x2="14" y2="3" stroke="currentColor" stroke-width="1.5" />
				{:else if dur.value === 'quarter'}
					<ellipse cx="8" cy="17" rx="6" ry="4.5" fill="currentColor" transform="rotate(-15, 8, 17)" />
					<line x1="14" y1="17" x2="14" y2="3" stroke="currentColor" stroke-width="1.5" />
				{:else}
					<ellipse cx="8" cy="17" rx="6" ry="4.5" fill="currentColor" transform="rotate(-15, 8, 17)" />
					<line x1="14" y1="17" x2="14" y2="3" stroke="currentColor" stroke-width="1.5" />
					<path d="M14 3 C14 3 18 8 18 13" fill="none" stroke="currentColor" stroke-width="1.5" />
				{/if}
			</svg>
			<span class="duration-label">{dur.label}</span>
		</button>
	{/each}
</div>

<style>
	.duration-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		background: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 0.15s;
		min-width: 2.5rem;
	}

	.duration-btn:hover {
		background: var(--color-surface-secondary);
		color: var(--color-text);
	}

	.duration-btn.active {
		background: var(--color-brand-light);
		border-color: var(--color-brand);
		color: var(--color-brand);
	}

	.duration-icon {
		width: 16px;
		height: 22px;
	}

	.duration-label {
		font-size: 0.625rem;
		font-weight: 600;
	}
</style>
