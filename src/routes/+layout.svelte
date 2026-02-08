<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/shared/Header.svelte';
	import Toast from '$lib/components/shared/Toast.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<Header />
	<main class="flex-1">
		{@render children()}
	</main>
	<footer class="border-t border-border py-2 text-center text-xs text-text-secondary no-print">
		<p>All data is stored <em>locally</em> in your browser. Remember to export your config as a backup!</p>
	</footer>
</div>

<Toast />
