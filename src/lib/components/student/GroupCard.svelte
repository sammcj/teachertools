<script lang="ts">
	import { formatGroupName } from '$lib/utils/emoji';

	interface Props {
		group: string[];
		index: number;
		useEmojiNames: boolean;
		delay: number;
	}

	let { group, index, useEmojiNames, delay }: Props = $props();

	const bgColours = [
		'bg-group-1/15 border-group-1',
		'bg-group-2/15 border-group-2',
		'bg-group-3/15 border-group-3',
		'bg-group-4/15 border-group-4',
		'bg-group-5/15 border-group-5',
		'bg-group-6/15 border-group-6',
		'bg-group-7/15 border-group-7',
		'bg-group-8/15 border-group-8'
	];

	const titleColours = [
		'text-group-1',
		'text-group-2',
		'text-group-3',
		'text-group-4',
		'text-group-5',
		'text-group-6',
		'text-group-7',
		'text-group-8'
	];

	let colourClass = $derived(bgColours[index % bgColours.length]);
	let titleColour = $derived(titleColours[index % titleColours.length]);
</script>

<div
	class="group-card rounded-2xl border-2 p-8 shadow-sm transition-transform hover:scale-[1.02] {colourClass}"
	style="animation: fadeSlideUp 0.5s ease-out {delay}s both"
>
	<h2 class="mb-5 text-center font-group text-3xl font-semibold {titleColour}">
		{formatGroupName(index, useEmojiNames)}
	</h2>

	<ul class="flex flex-col gap-2">
		{#each group as student}
			<li class="rounded-lg border border-border-strong bg-white/60 px-4 py-2.5 text-center text-lg font-medium text-text">
				{student}
			</li>
		{/each}
	</ul>
</div>

<style>
	@keyframes fadeSlideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
