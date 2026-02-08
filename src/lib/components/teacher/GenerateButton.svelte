<script lang="ts">
	import Button from '$lib/components/shared/Button.svelte';
	import {
		getCurrentListId,
		getList,
		saveGroups,
		setUseEmojiNames,
		addToast
	} from '$lib/stores/storage.svelte';
	import { generateGroups } from '$lib/utils/grouping';
	import { Shuffle } from 'lucide-svelte';

	let currentListId = $derived(getCurrentListId());
	let currentList = $derived(currentListId ? getList(currentListId) : null);
	let useEmoji = $derived(currentList?.useEmojiNames ?? true);

	function handleGenerate() {
		if (!currentListId || !currentList) {
			addToast('Select or create a class list first', 'error');
			return;
		}
		if (currentList.students.length === 0) {
			addToast('Add students to the list first', 'error');
			return;
		}

		const groups = generateGroups(
			currentList.students,
			currentList.groupSize,
			currentList.blacklist
		);
		saveGroups(currentListId, groups);
		addToast('Groups generated!', 'success');
	}

	function handleToggleEmoji() {
		if (currentListId) {
			setUseEmojiNames(currentListId, !useEmoji);
		}
	}
</script>

<div class="flex flex-wrap items-center gap-3">
	<Button size="lg" onclick={handleGenerate}>
		<Shuffle size={18} />
		Generate Groups
	</Button>
	<label class="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
		<input
			type="checkbox"
			checked={useEmoji}
			onchange={handleToggleEmoji}
			class="h-4 w-4 rounded border-border text-brand accent-brand focus:ring-brand"
		/>
		Use emoji names
	</label>
</div>
