<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from 'lucide-svelte';

	interface Props {
		open: boolean;
		title: string;
		children: Snippet;
		onclose: () => void;
	}

	let { open, title, children, onclose }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_interactive_supports_focus -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label={title}
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<div
			class="relative mx-4 w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-text">{title}</h2>
				<button
					onclick={onclose}
					class="rounded-lg p-1 text-text-secondary hover:bg-surface-secondary hover:text-text"
					aria-label="Close"
				>
					<X size={18} />
				</button>
			</div>
			{@render children()}
		</div>
	</div>
{/if}
