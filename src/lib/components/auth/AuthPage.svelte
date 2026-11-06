<script lang="ts">
	import type { Snippet } from 'svelte';
	import Header from '../Header.svelte';

	// The frame for the sign-in, sign-up, password, account and error pages: the header with the
	// logo, then the page.
	let {
		title,
		signedIn = false,
		children
	}: { title: string; signedIn?: boolean; children: Snippet } = $props();
</script>

<svelte:head>
	<title>{title} · PostScript Medical</title>
</svelte:head>

<Header {signedIn} />

<main class="central-align main-content auth-page">
	<h1>{title}</h1>
	{@render children()}
</main>

<style>
	.auth-page {
		color: var(--color-white);
		max-width: 28rem;
		width: 100%;
	}

	.auth-page :global(form) {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	/* The gap spaces the fields; drop the global form margin (app.css) so it isn't doubled. */
	.auth-page :global(form > *:not(:last-child)) {
		margin-bottom: 0;
	}

	.auth-page :global(.links) {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-6);
		font-size: var(--font-size-md);
	}

	.auth-page :global(.links a),
	.auth-page :global(p a) {
		color: var(--color-white);
	}

	.auth-page :global(.small) {
		font-size: var(--font-size-sm);
		opacity: 0.85;
	}
</style>
