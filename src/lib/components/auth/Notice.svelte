<script lang="ts">
	import type { Snippet } from 'svelte';

	// An error (announced at once) or an information message (announced politely).
	let { tone = 'info', children }: { tone?: 'error' | 'info'; children: Snippet } = $props();
</script>

<div class="notice {tone}" role={tone === 'error' ? 'alert' : 'status'}>
	{@render children()}
</div>

<style>
	.notice {
		border-radius: var(--radius-sm);
		padding: var(--space-3) var(--space-4);
		line-height: 1.4;
	}

	.notice :global(p) {
		margin: 0;
	}

	.error {
		background: var(--color-error-tint);
		border: 1px solid var(--color-error-border);
	}

	.info {
		background: var(--color-brand-tint);
		border: 1px solid var(--color-brand);
	}
</style>
