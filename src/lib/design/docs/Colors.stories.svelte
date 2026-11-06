<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { contrastRatio, parseRgb, wcagLevel } from './contrast.ts';
	import TokenTable from './TokenTable.svelte';
	import { tokensInGroup } from './tokens.ts';

	const { Story } = defineMeta({ title: 'Foundations/Colors', tags: ['!autodocs'] });

	const groups = ['Brand', 'Ink', 'White', 'Neutrals', 'Feedback'];

	// The text and background pairs the app really uses.
	const pairs = [
		['--color-ink', '--color-white', 'Body text, modals'],
		['--color-white', '--color-ink', 'Selected tools, the select control, the user menu'],
		['--color-white', '--color-brand', 'Primary buttons, text on the green pages'],
		['--color-white', '--color-danger', 'Destructive buttons'],
		['--color-error', '--color-white', 'ErrorMessage'],
		['--color-error-text', '--color-brand', 'Field errors on the green pages'],
		['--color-neutral-500', '--color-neutral-100', 'Disabled unstyled button']
	];

	/** A token's colour as the browser computes it: "rgb(r, g, b)". */
	function resolve(name: string) {
		const probe = document.createElement('span');
		probe.style.color = `var(${name})`;
		document.body.append(probe);
		const color = getComputedStyle(probe).color;
		probe.remove();
		return parseRgb(color) ?? ([0, 0, 0] as [number, number, number]);
	}

	function measure(foreground: string, background: string) {
		const ratio = contrastRatio(resolve(foreground), resolve(background));
		return { ratio: ratio.toFixed(2), level: wcagLevel(ratio) };
	}
</script>

<Story name="Palette" asChild>
	<div class="page">
		<h1>Colors</h1>
		<p>
			Green and near-black on white. The interface uses tokens only, so a component never carries a
			colour value of its own. Pen colours are the exception: they are drawing data, saved into
			annotations.
		</p>

		{#each groups as group (group)}
			<h2>{group}</h2>
			<TokenTable tokens={tokensInGroup(group)}>
				{#snippet preview(token)}
					<span class="swatch" style:background-color="var({token.name})"></span>
				{/snippet}
			</TokenTable>
		{/each}

		<h2>Contrast</h2>
		<p>Measured live from the tokens, against WCAG 2 AA (4.5:1, or 3:1 for large text).</p>
		<table>
			<thead>
				<tr><th>Sample</th><th>Text on background</th><th>Ratio</th><th>WCAG</th><th>Where</th></tr>
			</thead>
			<tbody>
				{#each pairs as [foreground, background, where] (foreground + background)}
					{@const result = measure(foreground, background)}
					<tr>
						<td>
							<span
								class="sample"
								style:color="var({foreground})"
								style:background="var({background})"
							>
								Aa
							</span>
						</td>
						<td><code>{foreground}</code> on <code>{background}</code></td>
						<td>{result.ratio}:1</td>
						<td class:fails={result.level !== 'AAA' && result.level !== 'AA'}>{result.level}</td>
						<td>{where}</td>
					</tr>
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

	code {
		font-size: var(--font-size-sm);
	}

	.swatch {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: block;
		height: 2rem;
		width: 4.5rem;
	}

	.sample {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: inline-block;
		font-weight: var(--font-weight-semibold);
		padding: var(--space-1) var(--space-3);
	}

	.fails {
		color: var(--color-danger);
		font-weight: var(--font-weight-semibold);
	}
</style>
