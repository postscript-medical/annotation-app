<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Logo from './Logo.svelte';

	// The page header (legacy PsHeader): the logo, linking to the app except on the app page
	// itself, and an `actions` area (share, feedback and the user menu arrive in 2.4–2.6).
	// Signed out: the large logo with the name; signed in: the small mark. White on the green
	// pages; `onLight` gives the full-colour logo for a white background (the annotate screen, 2.4).
	let {
		signedIn = false,
		onLight = false,
		actions
	}: { signedIn?: boolean; onLight?: boolean; actions?: Snippet } = $props();

	const logoStyle = $derived(`${signedIn ? 'small' : 'large'} ${onLight ? 'full-color' : 'white'}`);

	const onAnnotate = $derived(page.url.pathname === '/annotate');
</script>

<header>
	<div class="options">
		{#if onAnnotate}
			<Logo showName={!signedIn} style={logoStyle} />
		{:else}
			<a href={resolve('/(app)/annotate')} aria-label="PostScript Medical home">
				<Logo showName={!signedIn} style={logoStyle} />
			</a>
		{/if}
	</div>
	{#if actions}
		<div class="options">{@render actions()}</div>
	{/if}
</header>

<style>
	header {
		align-items: center;
		display: flex;
		justify-content: space-between;
		padding: var(--space-4) var(--space-4) 0 var(--space-4);
		width: 100%;
	}

	.options {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-2);
		justify-content: flex-end;
	}
</style>
