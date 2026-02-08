<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		children: Snippet;
	}

	let { variant = 'primary', size = 'md', children, class: className = '', ...rest }: Props = $props();

	const baseClasses = 'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:opacity-50 disabled:cursor-not-allowed';

	const variantClasses = {
		primary: 'bg-brand text-white hover:bg-brand-hover',
		secondary: 'bg-surface-secondary text-text border border-border hover:bg-surface hover:border-border-strong',
		danger: 'bg-danger text-white hover:bg-danger-hover',
		ghost: 'text-text-secondary hover:bg-surface-secondary hover:text-text'
	};

	const sizeClasses = {
		sm: 'px-2.5 py-1 text-xs',
		md: 'px-3.5 py-2 text-sm',
		lg: 'px-5 py-2.5 text-base'
	};
</script>

<button class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}" {...rest}>
	{@render children()}
</button>
