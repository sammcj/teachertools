<script lang="ts">
	import { getCurrentListId, getList, updateGroupSize } from '$lib/stores/storage.svelte';

	let currentListId = $derived(getCurrentListId());
	let currentList = $derived(currentListId ? getList(currentListId) : null);
	let groupSize = $derived(currentList?.groupSize ?? 3);

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const size = parseInt(target.value, 10);
		if (currentListId) {
			updateGroupSize(currentListId, size);
		}
	}
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold text-text-secondary">Group Size</h3>
		<span class="rounded-md bg-brand-light px-2 py-0.5 text-sm font-semibold text-brand">
			{groupSize}
		</span>
	</div>
	<input
		type="range"
		min="1"
		max="15"
		value={groupSize}
		oninput={handleChange}
		class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-secondary accent-brand"
	/>
	<div class="flex justify-between text-xs text-text-muted">
		<span>1</span>
		<span>5</span>
		<span>10</span>
		<span>15</span>
	</div>
</div>
