<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Token } from './parse-tokens.ts';

	// The tokens of a Foundations page, from tokens.css. `preview` draws a sample of one token.
	let { tokens, preview }: { tokens: Token[]; preview: Snippet<[Token]> } = $props();
</script>

<table>
	<thead>
		<tr><th>Preview</th><th>Token</th><th>Value</th><th>Use</th></tr>
	</thead>
	<tbody>
		{#each tokens as token (token.name)}
			<tr>
				<td class="preview">{@render preview(token)}</td>
				<td><code>{token.name}</code></td>
				<td class="value"><code>{token.value}</code></td>
				<td>{token.description}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
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
		vertical-align: middle;
	}

	.preview {
		width: 6rem;
	}

	code {
		font-size: var(--font-size-sm);
	}

	.value {
		max-width: 16rem;
		overflow-wrap: anywhere;
	}
</style>
