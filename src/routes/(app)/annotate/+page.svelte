<script lang="ts">
	import { browser } from '$app/env';
	import ImageAnnotation from '#lib/annotate/ImageAnnotation.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Annotate · PostScript Medical</title>
</svelte:head>

<!-- The page renders on the server (so the guard's 303 and the load run on the request itself),
     but the annotation screen mounts in the browser only: the sketchpad's stores are module
     singletons, shared between requests on a server, and it reads `window` when created (2.1). -->
{#if browser}
	<ImageAnnotation
		catalogue={data.catalogue}
		selection={data.selection}
		accountInitial={data.accountInitial}
	/>
{/if}
