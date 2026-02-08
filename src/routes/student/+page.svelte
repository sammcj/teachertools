<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import GroupCard from '$lib/components/student/GroupCard.svelte';
	import ConfettiEffect from '$lib/components/student/ConfettiEffect.svelte';
	import EmptyState from '$lib/components/student/EmptyState.svelte';
	import { decodeGroupData } from '$lib/utils/url';
	import { getCurrentListId, getList } from '$lib/stores/storage.svelte';
	import { ArrowLeft } from 'lucide-svelte';

	let groups = $state<string[][]>([]);
	let className = $state('Class Groups');
	let useEmojiNames = $state(true);
	let loaded = $state(false);
	let showConfetti = $state(false);

	onMount(() => {
		const params = $page.url.searchParams;
		const encodedData = params.get('data');
		const listIdParam = params.get('list');

		// Try URL params first
		if (encodedData) {
			const decoded = decodeGroupData(encodedData);
			if (decoded?.groups && decoded.groups.length > 0) {
				groups = decoded.groups;
				className = decoded.name || 'Class Groups';
				useEmojiNames = decoded.useEmojiNames ?? true;
				loaded = true;
				showConfetti = true;
				return;
			}
		}

		// Fallback to localStorage
		const listId = listIdParam || getCurrentListId();
		if (listId) {
			const list = getList(listId);
			if (list) {
				className = list.name;
				useEmojiNames = list.useEmojiNames;
				if (list.currentGroups && list.currentGroups.length > 0) {
					groups = list.currentGroups;
					loaded = true;
					showConfetti = true;
					return;
				}
			}
		}

		loaded = true;
	});
</script>

<svelte:head>
	<title>GroupThing - {className}</title>
</svelte:head>

<ConfettiEffect active={showConfetti} />

<div class="min-h-[calc(100vh-8rem)] px-6 py-6">
	<div>
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between no-print">
			<a
				href="{base}/teacher"
				class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text"
			>
				<ArrowLeft size={16} />
				Teacher View
			</a>
			<h1 class="font-title text-3xl font-bold text-text">{className}</h1>
			<div class="w-24"></div>
		</div>

		{#if groups.length > 0}
			<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each groups as group, i}
					<GroupCard {group} index={i} {useEmojiNames} delay={i * 0.1} />
				{/each}
			</div>
		{:else if loaded}
			<EmptyState />
		{/if}
	</div>
</div>
