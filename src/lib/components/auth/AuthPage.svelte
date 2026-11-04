<script lang="ts">
	import type { Snippet } from 'svelte';
	import Header from '../Header.svelte';

	// The frame for the sign-in, sign-up, password and account pages: the header with the logo,
	// then the page.
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
		color: #fff;
		max-width: 28rem;
		width: 100%;
	}

	.auth-page :global(form) {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* The gap spaces the fields; drop the global form margin (app.css) so it isn't doubled. */
	.auth-page :global(form > *:not(:last-child)) {
		margin-bottom: 0;
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
