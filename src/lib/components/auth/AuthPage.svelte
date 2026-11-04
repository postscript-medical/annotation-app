<script lang="ts">
	import type { Snippet } from 'svelte';

	// The frame for the sign-in, sign-up and password pages. Plain until the design system
	// lands (1.13).
	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<svelte:head>
	<title>{title} · PostScript Medical</title>
</svelte:head>

<main class="central-align main-content auth-page">
	<h1>{title}</h1>
	{@render children()}
</main>

<style>
	.auth-page {
		color: #fff;
		max-width: 28rem;
		width: 100%;
	}

	.auth-page :global(form) {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.auth-page :global(.links) {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		font-size: 0.875rem;
	}

	.auth-page :global(.links a),
	.auth-page :global(p a) {
		color: #fff;
	}

	.auth-page :global(.small) {
		font-size: 0.8125rem;
		opacity: 0.85;
	}
</style>
