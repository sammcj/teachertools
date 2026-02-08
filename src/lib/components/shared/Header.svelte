<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';

	const tabs = [
		{ label: 'GroupThing', href: `${base}/teacher`, matchPaths: [`${base}/teacher`, `${base}/student`] },
		{ label: 'Piano', href: `${base}/piano`, matchPaths: [`${base}/piano`] },
		{ label: 'Quiz Maker', href: '', disabled: true },
		{ label: 'Classroom Timer', href: '', disabled: true }
	];

	function isTabActive(tab: typeof tabs[number], path: string): boolean {
		if (!('matchPaths' in tab) || !tab.matchPaths) return false;
		return tab.matchPaths.some((p: string) => path.startsWith(p));
	}

	let currentPath = $derived($page.url.pathname);
</script>

<header class="border-b border-border bg-surface no-print">
	<div class="mx-auto flex items-center justify-between px-4 py-2 2xl:max-w-[1600px]">
		<h1 class="font-title text-lg font-bold text-text sm:text-xl">
			Emma's Teacher Tools
		</h1>
		<nav class="flex items-center gap-1">
			{#each tabs as tab}
				{#if tab.disabled}
					<span
						class="cursor-default rounded-lg px-3 py-1.5 text-sm text-text-muted"
						title="Coming Soon"
					>
						{tab.label}
						<span class="ml-1 rounded bg-surface-secondary px-1.5 py-0.5 text-xs">Soon</span>
					</span>
				{:else}
					<a
						href={tab.href}
						class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {isTabActive(tab, currentPath)
							? 'bg-brand text-white'
							: 'text-text-secondary hover:bg-surface-secondary'}"
					>
						{tab.label}
					</a>
				{/if}
			{/each}
		</nav>
	</div>
</header>
