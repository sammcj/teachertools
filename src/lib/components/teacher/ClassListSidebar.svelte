<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import {
		getLists,
		getCurrentListId,
		setCurrentList,
		createList,
		updateListName,
		deleteList,
		saveListOrder,
		addToast
	} from '$lib/stores/storage.svelte';
	import Modal from '$lib/components/shared/Modal.svelte';
	import Button from '$lib/components/shared/Button.svelte';
	import { GripVertical, Pencil, Trash2, Plus, Database, RotateCcw } from 'lucide-svelte';
	import {
		loadSampleData,
		clearAll
	} from '$lib/stores/storage.svelte';

	interface Props {
		onlistselect: (id: string) => void;
	}

	let { onlistselect }: Props = $props();

	let showModal = $state(false);
	let modalTitle = $state('Create New Class List');
	let editingId: string | null = $state(null);
	let nameInput = $state('');
	let showConfirmClear = $state(false);
	let showConfirmSample = $state(false);

	let lists = $derived(getLists());
	let currentListId = $derived(getCurrentListId());

	// Convert lists object to array for dnd-zone
	let listItems = $derived(
		Object.entries(lists).map(([id, list]) => ({
			id,
			name: list.name
		}))
	);

	// Track the draggable items separately to allow dnd to mutate
	let dragItems = $state<{ id: string; name: string }[]>([]);

	$effect(() => {
		dragItems = [...listItems];
	});

	function handleDndConsider(e: CustomEvent<{ items: { id: string; name: string }[] }>) {
		dragItems = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<{ items: { id: string; name: string }[] }>) {
		dragItems = e.detail.items;
		saveListOrder(dragItems.map((item) => item.id));
	}

	function openNewModal() {
		modalTitle = 'Create New Class List';
		editingId = null;
		nameInput = '';
		showModal = true;
	}

	function openEditModal(id: string, name: string) {
		modalTitle = 'Edit Class List';
		editingId = id;
		nameInput = name;
		showModal = true;
	}

	function saveModal() {
		const trimmed = nameInput.trim();
		if (!trimmed) {
			addToast('Please enter a list name', 'error');
			return;
		}

		if (editingId) {
			updateListName(editingId, trimmed);
		} else {
			const newId = createList(trimmed);
			setCurrentList(newId);
			onlistselect(newId);
		}
		showModal = false;
	}

	function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this list?')) {
			deleteList(id);
			addToast('List deleted', 'info');
		}
	}

	function handleSelect(id: string) {
		setCurrentList(id);
		onlistselect(id);
	}

	function handleLoadSample() {
		const id = loadSampleData();
		onlistselect(id);
		addToast('Sample data loaded', 'success');
		showConfirmSample = false;
	}

	function handleClearAll() {
		clearAll();
		addToast('All data cleared', 'info');
		showConfirmClear = false;
	}
</script>

<aside class="flex h-full flex-col">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-text-secondary">Class Lists</h2>
		<Button variant="primary" size="sm" onclick={openNewModal}>
			<Plus size={14} />
			New List
		</Button>
	</div>

	{#if dragItems.length > 0}
		<div
			class="flex-1 space-y-1 overflow-y-auto"
			use:dndzone={{ items: dragItems, flipDurationMs: 200 }}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
		>
			{#each dragItems as item (item.id)}
				<div
					class="group flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors
						{item.id === currentListId
						? 'border-brand bg-brand-light text-brand'
						: 'border-transparent hover:border-border hover:bg-surface-secondary'}"
					role="button"
					tabindex="0"
					onclick={() => handleSelect(item.id)}
					onkeydown={(e) => { if (e.key === 'Enter') handleSelect(item.id); }}
				>
					<span class="cursor-grab text-text-muted opacity-0 group-hover:opacity-100">
						<GripVertical size={14} />
					</span>
					<span class="flex-1 truncate text-sm">{item.name}</span>
					<div class="flex gap-0.5 opacity-0 group-hover:opacity-100">
						<button
							class="rounded p-1 hover:bg-surface"
							title="Edit name"
							onclick={(e) => { e.stopPropagation(); openEditModal(item.id, item.name); }}
						>
							<Pencil size={13} />
						</button>
						<button
							class="rounded p-1 text-danger hover:bg-danger-light"
							title="Delete list"
							onclick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
						>
							<Trash2 size={13} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex-1 py-8 text-center text-sm text-text-muted">
			No class lists yet. Create one to get started.
		</div>
	{/if}

	<div class="mt-3 flex gap-2 border-t border-border pt-3">
		<Button variant="secondary" size="sm" onclick={() => (showConfirmSample = true)}>
			<Database size={14} />
			Sample Data
		</Button>
		<Button variant="ghost" size="sm" onclick={() => (showConfirmClear = true)}>
			<RotateCcw size={14} />
			Clear All
		</Button>
	</div>
</aside>

<Modal open={showModal} title={modalTitle} onclose={() => (showModal = false)}>
	<div class="space-y-4">
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-text">List Name</span>
			<input
				type="text"
				bind:value={nameInput}
				placeholder="e.g., Class 1A"
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
				onkeydown={(e) => { if (e.key === 'Enter') saveModal(); }}
			/>
		</label>
		<div class="flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (showModal = false)}>Cancel</Button>
			<Button onclick={saveModal}>Save</Button>
		</div>
	</div>
</Modal>

<Modal open={showConfirmClear} title="Clear All Data" onclose={() => (showConfirmClear = false)}>
	<p class="mb-4 text-sm text-text-secondary">
		Are you sure you want to clear all data? This cannot be undone.
	</p>
	<div class="flex justify-end gap-2">
		<Button variant="secondary" onclick={() => (showConfirmClear = false)}>Cancel</Button>
		<Button variant="danger" onclick={handleClearAll}>Clear All</Button>
	</div>
</Modal>

<Modal open={showConfirmSample} title="Load Sample Data" onclose={() => (showConfirmSample = false)}>
	<p class="mb-4 text-sm text-text-secondary">
		This will replace your existing data with sample class lists. Continue?
	</p>
	<div class="flex justify-end gap-2">
		<Button variant="secondary" onclick={() => (showConfirmSample = false)}>Cancel</Button>
		<Button onclick={handleLoadSample}>Load Sample Data</Button>
	</div>
</Modal>
