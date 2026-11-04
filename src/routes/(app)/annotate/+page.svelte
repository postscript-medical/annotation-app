<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '#lib/components/Button.svelte';
	import Header from '#lib/components/Header.svelte';
</script>

<!-- Placeholder until the annotation screen is ported (execution plan 2.4). -->
<Header signedIn>
	{#snippet actions()}
		<!-- Until the user menu is ported (2.4). -->
		<a href={resolve('/(app)/account')}>Your account</a>
		<form method="POST" action="/logout">
			<Button type="submit" style="secondary">Sign out</Button>
		</form>
	{/snippet}
</Header>

<main class="central-align main-content">
	<h1>Annotate</h1>
	<p>The annotation screen is on its way.</p>
</main>

<style>
	main {
		color: #fff;
	}
</style>
