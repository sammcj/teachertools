<script lang="ts">
	import Button from '$lib/components/shared/Button.svelte';
	import { addStudents, removeStudents, getCurrentListId, getList, addToast } from '$lib/stores/storage.svelte';
	import { UserMinus, UserPlus } from 'lucide-svelte';

	let currentListId = $derived(getCurrentListId());
	let currentList = $derived(currentListId ? getList(currentListId) : null);

	let selectedStudents = $state<Set<string>>(new Set());
	let inputValue = $state('');
	let textareaEl: HTMLTextAreaElement | undefined = $state();

	function toggleStudent(name: string) {
		const next = new Set(selectedStudents);
		if (next.has(name)) {
			next.delete(name);
		} else {
			next.add(name);
		}
		selectedStudents = next;
	}

	function handleAdd() {
		if (!currentListId || !inputValue.trim()) {
			if (!currentListId) addToast('Select or create a class list first', 'error');
			else addToast('Enter at least one student name', 'error');
			return;
		}

		const result = addStudents(currentListId, inputValue);
		if (result.success && result.addedCount > 0) {
			let msg = `Added ${result.addedCount} student${result.addedCount !== 1 ? 's' : ''}`;
			if (result.duplicateCount > 0) {
				msg += ` (${result.duplicateCount} duplicate${result.duplicateCount !== 1 ? 's' : ''} skipped)`;
			}
			addToast(msg, 'success');
		} else if (result.duplicateCount > 0) {
			addToast(`All ${result.duplicateCount} student${result.duplicateCount !== 1 ? 's' : ''} already exist`, 'error');
		}
		inputValue = '';
		textareaEl?.focus();
	}

	function handleRemove() {
		if (selectedStudents.size === 0) {
			addToast('Select students to remove', 'error');
			return;
		}
		if (!currentListId) return;

		removeStudents(currentListId, [...selectedStudents]);
		selectedStudents = new Set();
		addToast('Students removed', 'info');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleAdd();
		}
	}
</script>

<div class="space-y-3">
	<h3 class="text-sm font-semibold text-text-secondary">Students</h3>

	{#if currentList?.students && currentList.students.length > 0}
		<div class="max-h-52 overflow-y-auto rounded-lg border border-border">
			{#each currentList.students as student}
				<button
					class="block w-full px-3 py-1.5 text-left text-sm transition-colors
						{selectedStudents.has(student)
						? 'bg-brand-light text-brand font-medium'
						: 'hover:bg-surface-secondary'}"
					onclick={() => toggleStudent(student)}
				>
					{student}
				</button>
			{/each}
		</div>
	{:else}
		<p class="py-4 text-center text-sm text-text-muted">No students yet. Add some below.</p>
	{/if}

	<div class="space-y-2">
		<textarea
			bind:this={textareaEl}
			bind:value={inputValue}
			placeholder="Enter student name(s) — one per line for multiple. Shift+Enter for a new line."
			class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
			rows="2"
			onkeydown={handleKeydown}
		></textarea>
		<div class="flex gap-2">
			<Button variant="primary" size="sm" onclick={handleAdd}>
				<UserPlus size={14} />
				Add
			</Button>
			{#if selectedStudents.size > 0}
				<Button variant="danger" size="sm" onclick={handleRemove}>
					<UserMinus size={14} />
					Remove Selected ({selectedStudents.size})
				</Button>
			{/if}
		</div>
	</div>
</div>
