<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<!-- Placeholder until the annotation screen is ported (execution plan 2.4). -->
<main class="central-align main-content">
	<h1>Annotate</h1>
	<p>The annotation screen is on its way.</p>
	<!-- Until the user menu is ported (2.4). -->
	<p><a href={resolve('/(app)/account')}>Your account</a></p>
	<form method="POST" action="/logout"><button type="submit">Sign out</button></form>
</main>

<style>
	main {
		color: #fff;
	}

	a {
		color: #fff;
	}
</style>
