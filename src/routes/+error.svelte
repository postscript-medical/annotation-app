<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AuthPage from '#lib/components/auth/AuthPage.svelte';
	import Link from '#lib/components/Link.svelte';

	// Every page-level error (legacy screens/NotFound.svelte). The message comes from handleError,
	// so it is always a generic one. A 404 needs no reference; anything else shows the request id,
	// so a report can be matched to the logs.
	const notFound = $derived(page.status === 404);
</script>

<AuthPage title={notFound ? 'Page not found' : 'Something went wrong'}>
	<p>{page.error?.message}</p>

	{#if !notFound && page.error?.requestId}
		<p class="small">Reference: {page.error.requestId}</p>
	{/if}

	<p>
		{notFound ? 'Check the address, or go back to' : 'Please try again, or go back to'}
		<Link href={resolve('/(app)/annotate')} style="on-dark">PostScript</Link>.
	</p>
</AuthPage>
