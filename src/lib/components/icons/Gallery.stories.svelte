<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { Component } from 'svelte';
	import { SIZE_LARGE, SIZE_MEDIUM, SIZE_SMALL, type Size } from './sizes.ts';
	import IconEraserSize from './IconEraserSize.svelte';
	import IconLineThickness from './IconLineThickness.svelte';

	const { Story } = defineMeta({ title: 'Foundations/Icons', tags: ['!autodocs'] });

	// Every Icon*.svelte, so a new icon shows up here without touching this file.
	const modules = import.meta.glob<{ default: Component }>('./Icon?*.svelte', { eager: true });
	const icons = Object.entries(modules).map(([path, module]) => ({
		name: path.replace(/^\.\/|\.svelte$/g, ''),
		component: module.default
	}));
	const sizes: Size[] = [SIZE_SMALL, SIZE_MEDIUM, SIZE_LARGE];
</script>

<Story name="Gallery" asChild>
	<div class="page">
		<h1>Icons</h1>
		<p>
			Each icon draws into a 24×24 frame, is 1em square and takes <code>currentColor</code>, so it
			follows the <code>font-size</code> and <code>color</code> of whatever holds it. Its accessible
			name comes from <code>Icon.svelte</code>. To add one, wrap SVG-only elements in
			<code>Icon</code> and save it as <code>icons/IconName.svelte</code>.
		</p>
		<ul class="plain grid">
			{#each icons as { name, component: Glyph } (name)}
				<li>
					<span class="glyph"><Glyph /></span>
					<code>{name}</code>
				</li>
			{/each}
		</ul>

		<h2>Sized icons</h2>
		<p>Two icons draw the size they stand for, from a <code>size</code> prop.</p>
		<ul class="plain grid">
			{#each sizes as size (size)}
				<li>
					<span class="glyph"><IconLineThickness {size} /></span>
					<code>IconLineThickness {size}</code>
				</li>
				<li>
					<span class="glyph"><IconEraserSize {size} /></span>
					<code>IconEraserSize {size}</code>
				</li>
			{/each}
		</ul>
	</div>
</Story>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 60rem;
	}

	.grid {
		display: grid;
		gap: var(--space-4);
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
	}

	li {
		align-items: center;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		text-align: center;
	}

	.glyph {
		font-size: var(--font-size-xl);
	}

	code {
		font-size: var(--font-size-xs);
	}
</style>
