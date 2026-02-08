<script lang="ts">
	import Button from '$lib/components/shared/Button.svelte';
	import {
		getCurrentListId,
		getList,
		addIncompatiblePairs,
		removeIncompatiblePairs,
		addToast
	} from '$lib/stores/storage.svelte';
	import { ChevronDown, ChevronRight, UserPlus, Trash2, Plus } from 'lucide-svelte';

	let currentListId = $derived(getCurrentListId());
	let currentList = $derived(currentListId ? getList(currentListId) : null);

	let expanded = $state(false);
	let selectedPairIndices = $state<Set<number>>(new Set());
	let selectedStudentsForPairing = $state<string[]>([]);
	let studentSelectValue = $state('');

	function addStudentToPairing() {
		if (!studentSelectValue) {
			addToast('Select a student to add', 'error');
			return;
		}
		if (selectedStudentsForPairing.includes(studentSelectValue)) {
			addToast('Student already added', 'error');
			return;
		}
		selectedStudentsForPairing = [...selectedStudentsForPairing, studentSelectValue];
		studentSelectValue = '';
	}

	function removeStudentFromPairing(student: string) {
		selectedStudentsForPairing = selectedStudentsForPairing.filter((s) => s !== student);
	}

	function handleAddPairs() {
		if (!currentListId) return;
		if (selectedStudentsForPairing.length < 2) {
			addToast('Select at least two students', 'error');
			return;
		}

		const count = addIncompatiblePairs(currentListId, selectedStudentsForPairing);
		if (count > 0) {
			addToast(`Added ${count} incompatible pair${count !== 1 ? 's' : ''}`, 'success');
		}
		selectedStudentsForPairing = [];
	}

	function togglePairSelection(index: number) {
		const next = new Set(selectedPairIndices);
		if (next.has(index)) {
			next.delete(index);
		} else {
			next.add(index);
		}
		selectedPairIndices = next;
	}

	function handleRemovePairs() {
		if (!currentListId || !currentList?.blacklist) return;
		if (selectedPairIndices.size === 0) {
			addToast('Select pairs to remove', 'error');
			return;
		}

		const pairsToRemove = [...selectedPairIndices].map((i) => currentList!.blacklist[i]);
		removeIncompatiblePairs(currentListId, pairsToRemove);
		selectedPairIndices = new Set();
		addToast('Pairs removed', 'info');
	}
</script>

<div class="rounded-xl border border-border">
	<button
		class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-secondary"
		onclick={() => (expanded = !expanded)}
	>
		{#if expanded}
			<ChevronDown size={16} />
		{:else}
			<ChevronRight size={16} />
		{/if}
		Grouping Rules
		{#if currentList?.blacklist && currentList.blacklist.length > 0}
			<span class="ml-auto rounded-full bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
				{currentList.blacklist.length}
			</span>
		{/if}
	</button>

	{#if expanded}
		<div class="space-y-3 border-t border-border px-4 py-3">
			<p class="text-xs text-text-muted">Define students who should not be grouped together.</p>

			{#if currentList?.blacklist && currentList.blacklist.length > 0}
				<div class="max-h-36 overflow-y-auto rounded-lg border border-border">
					{#each currentList.blacklist as pair, index}
						<button
							class="block w-full px-3 py-1.5 text-left text-sm transition-colors
								{selectedPairIndices.has(index)
								? 'bg-danger-light text-danger font-medium'
								: 'hover:bg-surface-secondary'}"
							onclick={() => togglePairSelection(index)}
						>
							{pair[0]} & {pair[1]}
						</button>
					{/each}
				</div>
				{#if selectedPairIndices.size > 0}
					<Button variant="danger" size="sm" onclick={handleRemovePairs}>
						<Trash2 size={14} />
						Remove Selected ({selectedPairIndices.size})
					</Button>
				{/if}
			{/if}

			<!-- Add new pairing -->
			<div class="space-y-2 rounded-lg bg-surface-secondary p-3">
				<div class="flex gap-2">
					<select
						bind:value={studentSelectValue}
						class="flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
					>
						<option value="">Select student...</option>
						{#if currentList?.students}
							{#each currentList.students as student}
								<option value={student}>{student}</option>
							{/each}
						{/if}
					</select>
					<Button variant="secondary" size="sm" onclick={addStudentToPairing}>
						<Plus size={14} />
						Add
					</Button>
				</div>

				{#if selectedStudentsForPairing.length > 0}
					<div class="flex flex-wrap gap-1.5">
						{#each selectedStudentsForPairing as student}
							<span class="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand">
								{student}
								<button
									class="hover:text-danger"
									onclick={() => removeStudentFromPairing(student)}
								>&times;</button>
							</span>
						{/each}
					</div>
				{/if}

				<Button variant="secondary" size="sm" onclick={handleAddPairs} disabled={selectedStudentsForPairing.length < 2}>
					<UserPlus size={14} />
					Add Grouping Rule
				</Button>
			</div>
		</div>
	{/if}
</div>
