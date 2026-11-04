<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	// A styled link (legacy PsLink). `style`: "on-dark" for white text. Pass an internal `href`
	// through `resolve()` from $app/paths. A link opening a new tab gets rel="noopener noreferrer".
	type Props = { style?: string; children: Snippet } & Omit<
		HTMLAnchorAttributes,
		'style' | 'children'
	>;

	let { style = '', target = '_self', rel, children, ...rest }: Props = $props();
</script>

<a
	class={style}
	{target}
	rel={target === '_blank' ? (rel ?? 'noopener noreferrer') : rel}
	{...rest}
>
	{@render children()}
</a>

<style>
	a.on-dark {
		color: white;
	}
</style>
