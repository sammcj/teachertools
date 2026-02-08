<script lang="ts">
	import { base } from '$app/paths';

	interface Props {
		message?: string;
	}

	let { message = 'No groups have been generated yet. Please ask your teacher to generate groups.' }: Props = $props();
</script>

<div class="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
	<p class="text-lg text-text-secondary">{message}</p>
	<a
		href="{base}/teacher"
		class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
	>
		Go to Teacher View
	</a>
</div>
