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
		border-radius: 4px;
		padding: 0.75rem 1rem;
		line-height: 1.4;
	}

	.notice :global(p) {
		margin: 0;
	}

	.error {
		background: rgba(200, 40, 40, 0.25);
		border: 1px solid rgb(230, 90, 90);
	}

	.info {
		background: rgba(55, 154, 70, 0.25);
		border: 1px solid rgb(55, 154, 70);
	}
</style>
