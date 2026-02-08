<script lang="ts">
	import { getToasts, removeToast } from '$lib/stores/storage.svelte';
	import { X } from 'lucide-svelte';

	let toasts = $derived(getToasts());
</script>

{#if toasts.length > 0}
	<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
		{#each toasts as toast (toast.id)}
			<div
				class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all
					{toast.type === 'error' ? 'bg-danger' : toast.type === 'success' ? 'bg-success' : 'bg-brand'}"
				role="alert"
			>
				<span>
					{toast.message}
					{#if toast.linkHref}
						<a href={toast.linkHref} class="ml-1 underline underline-offset-2 hover:no-underline">{toast.linkText ?? 'Open'}</a>
					{/if}
				</span>
				<button onclick={() => removeToast(toast.id)} class="ml-2 opacity-70 hover:opacity-100">
					<X size={14} />
				</button>
			</div>
		{/each}
	</div>
{/if}
