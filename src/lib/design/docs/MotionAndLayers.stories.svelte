<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TokenTable from './TokenTable.svelte';
	import { tokensInGroup } from './tokens.ts';

	const { Story } = defineMeta({ title: 'Foundations/Motion and layers', tags: ['!autodocs'] });

	const animations = [
		['Button loading dot', 'GSAP', 'Label fades into a dot that spins for as long as it loads'],
		['Tool drawer', 'GSAP', '0.15s, circ.inOut, options staggered by 0.05s'],
		['User menu', 'GSAP', '0.05s scale from the top right, links fade in by 0.025s'],
		['Catalogue panel', 'Svelte fly', '1s, expoInOut, in from the right']
	];
</script>

<Story name="Motion" asChild>
	<div class="page">
		<h1>Motion and layers</h1>
		<p>
			Motion is short and functional. CSS transitions use the tokens below. Larger entrances are
			GSAP timelines driven by Svelte's transition clock, which also plays them in reverse on the
			way out.
		</p>

		<h2>Duration</h2>
		<TokenTable tokens={tokensInGroup('Duration')}>
			{#snippet preview(token)}<code>{token.value}</code>{/snippet}
		</TokenTable>

		<h2>Animations in the app</h2>
		<table>
			<thead><tr><th>Where</th><th>With</th><th>How</th></tr></thead>
			<tbody>
				{#each animations as [where, tool, how] (where)}
					<tr><td>{where}</td><td>{tool}</td><td>{how}</td></tr>
				{/each}
			</tbody>
		</table>
		<p>
			<code>prefers-reduced-motion</code> stops CSS motion (<code>app.css</code>), but not GSAP or
			the Svelte <code>fly</code>. See the Design audit. Keep <code>transition-duration</code> at
			<code>0s</code> in that rule: any non-zero value makes GSAP's <code>.from()</code> read mid-transition
			values as its end values.
		</p>

		<h2>Layers</h2>
		<TokenTable tokens={tokensInGroup('Layer')}>
			{#snippet preview(token)}<code>{token.value}</code>{/snippet}
		</TokenTable>
		<p>
			A modal's <code>&lt;dialog&gt;</code> sits in the browser's top layer, above all of these.
		</p>
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
