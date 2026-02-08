<script lang="ts">
	import { getCurrentListId, getList } from '$lib/stores/storage.svelte';
	import { formatGroupName } from '$lib/utils/emoji';

	let currentListId = $derived(getCurrentListId());
	let currentList = $derived(currentListId ? getList(currentListId) : null);
	let groups = $derived(currentList?.currentGroups ?? []);
	let useEmoji = $derived(currentList?.useEmojiNames ?? true);

	const groupColours = [
		'border-l-group-1',
		'border-l-group-2',
		'border-l-group-3',
		'border-l-group-4',
		'border-l-group-5',
		'border-l-group-6',
		'border-l-group-7',
		'border-l-group-8'
	];
</script>

<div class="space-y-3">
	<h3 class="text-sm font-semibold text-text-secondary">Generated Groups</h3>

	{#if groups.length > 0}
		<div class="grid gap-3 sm:grid-cols-2">
			{#each groups as group, i}
				<div class="rounded-lg border border-border bg-surface p-3 border-l-4 {groupColours[i % groupColours.length]}">
					<h4 class="mb-1.5 text-sm font-semibold text-text">
						{formatGroupName(i, useEmoji)}
					</h4>
					<ul class="space-y-0.5">
						{#each group as student}
							<li class="text-sm text-text-secondary">{student}</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{:else}
		<p class="py-6 text-center text-sm text-text-muted">
			No groups generated yet. Use the Generate Groups button.
		</p>
	{/if}
</div>
