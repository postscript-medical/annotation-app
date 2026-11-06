<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TokenTable from './TokenTable.svelte';
	import { tokensInGroup } from './tokens.ts';

	const { Story } = defineMeta({ title: 'Foundations/Typography', tags: ['!autodocs'] });
</script>

<Story name="Type" asChild>
	<div class="page">
		<h1>Typography</h1>
		<p>
			Montserrat everywhere, a variable font self-hosted from <code>static/fonts</code> (weights 100 to
			900, normal and italic, Latin and Latin Extended; OFL licence). The app loads no fonts from another
			host, in keeping with its Content Security Policy. Body text is 16px at a line height of 1.5, and
			paragraphs stop at 60 characters wide.
		</p>

		<h2>Elements</h2>
		<div class="samples">
			<h1>Heading one</h1>
			<h2>Heading two, weight 400, line height 1</h2>
			<h3>Heading three, weight 400</h3>
			<p>
				Body text. Annotate an illustration and share it from your device, so the image never goes
				through a server.
			</p>
			<p class="note">Note: the <code>.note</code> class, for small print inside a block.</p>
			<p><a href="#typography">A link keeps the text colour and is always underlined</a></p>
		</div>

		<h2>Font size</h2>
		<TokenTable tokens={tokensInGroup('Font size')}>
			{#snippet preview(token)}<span style:font-size="var({token.name})">Aa</span>{/snippet}
		</TokenTable>

		<h2>Font weight</h2>
		<TokenTable tokens={tokensInGroup('Font weight')}>
			{#snippet preview(token)}<span style:font-weight="var({token.name})">Aa</span>{/snippet}
		</TokenTable>

		<h2>Font family</h2>
		<TokenTable tokens={tokensInGroup('Font family')}>
			{#snippet preview(token)}<span style:font-family="var({token.name})">Aa</span>{/snippet}
		</TokenTable>
	</div>
</Story>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 70rem;
	}

	.samples {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
</style>
