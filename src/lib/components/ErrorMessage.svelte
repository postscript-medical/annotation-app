<script lang="ts">
	// An inline error (legacy ErrorMessage). Renders nothing without a message; announced to
	// screen readers when it appears.
	let { message }: { message?: string | null } = $props();
</script>

{#if message}
	<div role="alert">{message}</div>
{/if}

<style>
	div {
		background-color: var(--color-white);
		background-image: linear-gradient(
			to right,
			var(--color-error),
			var(--color-error) 2.5rem,
			var(--color-white) 2.5rem
		);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-sm);
		padding: var(--space-2);
		color: var(--color-error);
		padding-left: 3rem;
		font-size: var(--font-size-md);
		line-height: 1rem;
	}
</style>
