<script lang="ts">
	import { base } from '$app/paths';
	import ClassListSidebar from '$lib/components/teacher/ClassListSidebar.svelte';
	import StudentList from '$lib/components/teacher/StudentList.svelte';
	import GroupSizeSlider from '$lib/components/teacher/GroupSizeSlider.svelte';
	import GenerateButton from '$lib/components/teacher/GenerateButton.svelte';
	import GroupingRules from '$lib/components/teacher/GroupingRules.svelte';
	import GroupPreview from '$lib/components/teacher/GroupPreview.svelte';
	import ExportImport from '$lib/components/teacher/ExportImport.svelte';
	import { getCurrentListId, getList } from '$lib/stores/storage.svelte';
	import { buildStudentViewUrl } from '$lib/utils/url';
	import { ExternalLink } from 'lucide-svelte';

	let currentListId = $derived(getCurrentListId());
	let currentList = $derived(currentListId ? getList(currentListId) : null);

	// Force reactivity refresh key
	let refreshKey = $state(0);

	function handleListSelect(_id: string) {
		refreshKey++;
	}

	function handleImported() {
		refreshKey++;
	}

	let studentViewUrl = $derived(
		currentListId && currentList
			? buildStudentViewUrl(
					base,
					currentListId,
					currentList.name,
					currentList.currentGroups,
					currentList.useEmojiNames
				)
			: `${base}/student`
	);
</script>

<div class="mx-auto flex flex-col gap-4 p-4 lg:flex-row 2xl:max-w-[1600px]" data-refresh={refreshKey}>
	<!-- Sidebar -->
	<div class="w-full shrink-0 rounded-xl border border-border bg-surface p-4 lg:w-72">
		<ClassListSidebar onlistselect={handleListSelect} />
	</div>

	<!-- Main content -->
	<div class="flex-1 space-y-4">
		{#if currentList}
			<!-- Header row -->
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h2 class="font-title text-xl font-bold text-text">
					{currentList.name}
				</h2>
				<div class="flex items-center gap-3">
					<ExportImport onimported={handleImported} />
					<a
						href={studentViewUrl}
						class="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
					>
						<ExternalLink size={14} />
						Student View
					</a>
				</div>
			</div>

			<!-- Controls -->
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-4 rounded-xl border border-border bg-surface p-4">
					<GenerateButton />
					<GroupSizeSlider />
				</div>
				<div class="rounded-xl border border-border bg-surface p-4">
					<StudentList />
				</div>
			</div>

			<!-- Grouping rules -->
			<GroupingRules />

			<!-- Groups preview -->
			<div class="rounded-xl border border-border bg-surface p-4">
				<GroupPreview />
			</div>
		{:else}
			<div class="flex h-64 items-center justify-center rounded-xl border border-dashed border-border">
				<p class="text-text-muted">Select or create a class list to get started.</p>
			</div>
		{/if}
	</div>
</div>
