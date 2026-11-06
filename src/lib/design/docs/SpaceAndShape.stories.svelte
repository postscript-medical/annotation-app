<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TokenTable from './TokenTable.svelte';
	import { tokensInGroup } from './tokens.ts';

	const { Story } = defineMeta({ title: 'Foundations/Space and shape', tags: ['!autodocs'] });

	const breakpoints = [
		['Phone', 'under 600px', 'Toolbar along the bottom; small logo'],
		['Tablet', '600 to 899px', 'Large logo; modals get their minimum width'],
		['Laptop', '900 to 1199px', 'Toolbar down the left; drawers open sideways'],
		['Wide', '1200px and up', 'Bigger catalogue thumbnails']
	];

	const helpers = [
		['.stacker', 'Column with a 1rem gap'],
		['.stacker--small', 'Column with a 0.5rem gap'],
		['.wrapper', 'Wrapping row with a 1rem gap'],
		['.central-align', 'Centred, up to 100 characters wide'],
		['.main-content', '1rem of padding around a page'],
		['.shadow', 'The one shadow, for raised surfaces'],
		['.visually-hidden', 'For screen readers only'],
		['.link-style', 'A button that looks like a link'],
		['ol.plain, ul.plain', 'A list without bullets or indent']
	];
</script>

<Story name="Scales" asChild>
	<div class="page">
		<h1>Space and shape</h1>
		<p>Spacing comes from one scale, and most layouts use 0.5rem, 1rem or 2rem.</p>

		<h2>Space</h2>
		<TokenTable tokens={tokensInGroup('Space')}>
			{#snippet preview(token)}<span class="bar" style:width="var({token.name})"></span>{/snippet}
		</TokenTable>

		<h2>Radius</h2>
		<TokenTable tokens={tokensInGroup('Radius')}>
			{#snippet preview(token)}<span class="box" style:border-radius="var({token.name})"
				></span>{/snippet}
		</TokenTable>

		<h2>Shadow</h2>
		<TokenTable tokens={tokensInGroup('Shadow')}>
			{#snippet preview(token)}<span class="box raised" style:box-shadow="var({token.name})"
				></span>{/snippet}
		</TokenTable>

		<h2>Breakpoints</h2>
		<p>
			CSS custom properties can't be used in media queries, so these are written out where needed.
			They match <code>viewportType</code> in <code>sketchpad/stores.ts</code> and this Storybook's viewport
			menu.
		</p>
		<table>
			<thead><tr><th>Name</th><th>Width</th><th>What changes</th></tr></thead>
			<tbody>
				{#each breakpoints as [name, width, change] (name)}
					<tr><td>{name}</td><td>{width}</td><td>{change}</td></tr>
				{/each}
			</tbody>
		</table>

		<h2>Helper classes</h2>
		<p>From <code>src/app.css</code>.</p>
		<table>
			<thead><tr><th>Class</th><th>What it does</th></tr></thead>
			<tbody>
				{#each helpers as [name, use] (name)}
					<tr><td><code>{name}</code></td><td>{use}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</Story>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 70rem;
	}

	h2 {
		margin-top: var(--space-4);
	}

	.bar {
		background-color: var(--color-brand);
		display: block;
		height: var(--space-4);
	}

	.box {
		background-color: var(--color-brand);
		display: block;
		height: 2.5rem;
		width: 2.5rem;
	}

	.raised {
		background-color: var(--color-white);
	}

	table {
		border-collapse: collapse;
		font-size: var(--font-size-md);
		width: 100%;
	}

	th {
		font-weight: var(--font-weight-semibold);
	}

	th,
	td {
		border-bottom: 1px solid var(--color-border);
		padding: var(--space-2) var(--space-3);
	}
</style>
