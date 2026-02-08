<script lang="ts">
	import Button from '$lib/components/shared/Button.svelte';
	import Modal from '$lib/components/shared/Modal.svelte';
	import { getData, replaceData, addToast } from '$lib/stores/storage.svelte';
	import { exportSettings, importSettings } from '$lib/utils/export-import';
	import { Download, Upload } from 'lucide-svelte';

	interface Props {
		onimported: () => void;
	}

	let { onimported }: Props = $props();

	let showImportModal = $state(false);
	let importError = $state('');
	let fileInput: HTMLInputElement | undefined = $state();

	function handleExport() {
		exportSettings(getData());
		addToast('Settings exported', 'success');
	}

	async function handleImport() {
		if (!fileInput?.files?.[0]) {
			importError = 'Please select a file to import';
			return;
		}

		const file = fileInput.files[0];
		if (!file.name.endsWith('.json') && file.type !== 'application/json') {
			importError = 'Please select a JSON file';
			return;
		}

		try {
			const imported = await importSettings(file);
			replaceData(imported);
			showImportModal = false;
			addToast('Settings imported', 'success');
			onimported();
		} catch (e) {
			importError = e instanceof Error ? e.message : 'Import failed';
		}
	}

	function openImportModal() {
		importError = '';
		showImportModal = true;
	}
</script>

<div class="flex gap-2">
	<Button variant="secondary" size="sm" onclick={handleExport}>
		<Download size={14} />
		Export
	</Button>
	<Button variant="secondary" size="sm" onclick={openImportModal}>
		<Upload size={14} />
		Import
	</Button>
</div>

<Modal open={showImportModal} title="Import Settings" onclose={() => (showImportModal = false)}>
	<div class="space-y-4">
		<p class="text-sm text-text-secondary">
			Select a GroupThing settings file to import. This will replace your current data.
		</p>
		<input
			bind:this={fileInput}
			type="file"
			accept=".json"
			class="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-hover"
		/>
		{#if importError}
			<p class="text-sm text-danger">{importError}</p>
		{/if}
		<div class="flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (showImportModal = false)}>Cancel</Button>
			<Button onclick={handleImport}>Import</Button>
		</div>
	</div>
</Modal>
