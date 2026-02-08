<script lang="ts">
	import type { NoteDefinition } from '$lib/types/piano';

	interface Props {
		note: NoteDefinition;
		isActive: boolean;
		showLabel: boolean;
		showShortcut: boolean;
		showColour: boolean;
		dimmed: boolean;
	}

	let { note, isActive, showLabel, showShortcut, showColour, dimmed }: Props = $props();

	let displayLabel = $derived(
		note.accidental === '#' ? `${note.name}#` : note.name
	);
</script>

<button
	class="piano-key"
	class:black={note.isBlack}
	class:white={!note.isBlack}
	class:active={isActive}
	class:dimmed
	style:--key-colour={showColour ? note.colour : undefined}
	data-note-id={note.id}
	aria-label="{displayLabel}{note.octave}"
>
	{#if showLabel}
		<span class="key-label">{displayLabel}</span>
	{/if}
	{#if showShortcut && note.keyboardKey}
		<span class="key-shortcut">{note.keyboardKey}</span>
	{/if}
</button>

<style>
	.piano-key {
		position: relative;
		border: none;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		padding-bottom: 0.5rem;
		transition: background-color 0.05s, opacity 0.2s;
		-webkit-tap-highlight-color: transparent;
		touch-action: none;
		user-select: none;
	}

	.white {
		background: var(--key-colour, #ffffff);
		border: 1px solid #d4d4d4;
		border-radius: 0 0 0.375rem 0.375rem;
		flex: 1 1 0;
		min-width: 1.5rem;
		height: 8.5rem;
		z-index: 1;
	}

	@media (min-width: 640px) {
		.white {
			min-width: 2rem;
			height: 12rem;
		}
	}

	.white:not(.active):not([style*="--key-colour"]) {
		background: #ffffff;
	}

	.white.active {
		background: var(--key-colour, #e5e7eb);
		filter: brightness(0.85);
	}

	.white:not(.active):where([style*="--key-colour"]) {
		background: color-mix(in srgb, var(--key-colour) 25%, white);
	}

	.black {
		background: var(--key-colour, #1a1a1a);
		border: 1px solid #000;
		border-radius: 0 0 0.25rem 0.25rem;
		width: 1.25rem;
		height: 5.5rem;
		position: absolute;
		z-index: 2;
		color: white;
	}

	@media (min-width: 640px) {
		.black {
			width: 1.75rem;
			height: 8rem;
		}
	}

	.black:not(.active):not([style*="--key-colour"]) {
		background: #1a1a1a;
	}

	.black:not(.active):where([style*="--key-colour"]) {
		background: color-mix(in srgb, var(--key-colour) 60%, black 40%);
	}

	.black.active {
		background: var(--key-colour, #4b5563);
		filter: brightness(1.3);
	}

	.dimmed {
		opacity: 0.35;
	}

	.key-label {
		font-size: 0.55rem;
		font-weight: 600;
		pointer-events: none;
		line-height: 1;
	}

	@media (min-width: 640px) {
		.key-label {
			font-size: 0.7rem;
		}
	}

	.white .key-label {
		color: #374151;
	}

	.black .key-label {
		color: #e5e7eb;
	}

	.key-shortcut {
		font-size: 0.55rem;
		pointer-events: none;
		opacity: 0.6;
		margin-top: 0.15rem;
		text-transform: uppercase;
		line-height: 1;
	}

	.white .key-shortcut {
		color: #6b7280;
	}

	.black .key-shortcut {
		color: #d1d5db;
	}
</style>
