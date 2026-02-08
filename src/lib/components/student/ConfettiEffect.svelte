<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		active: boolean;
	}

	let { active }: Props = $props();

	onMount(() => {
		if (active) {
			fireConfetti();
		}
	});

	$effect(() => {
		if (active) {
			fireConfetti();
		}
	});

	async function fireConfetti() {
		try {
			const confetti = (await import('canvas-confetti')).default;
			const colours = [
				'#f472b6', '#34d399', '#a78bfa', '#fbbf24',
				'#f87171', '#4ade80', '#fb923c', '#38bdf8'
			];

			// Two bursts for a nice effect
			confetti({
				particleCount: 80,
				spread: 70,
				origin: { y: 0.6, x: 0.3 },
				colors: colours
			});

			setTimeout(() => {
				confetti({
					particleCount: 80,
					spread: 70,
					origin: { y: 0.6, x: 0.7 },
					colors: colours
				});
			}, 200);
		} catch {
			// Silently ignore if confetti fails to load
		}
	}
</script>
