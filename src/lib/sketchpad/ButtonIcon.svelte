<svelte:options runes={false} />

<!-- Ported as-is (2.1) from legacy components/sketchpad; legacy (non-runes) mode until 2.9. -->
<script>
	// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.9).
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let value = null;
	export let onDark = false;
	export let testId = '';

	function changeTool() {
		dispatch('click', value);
	}

	function handleLeave() {
		dispatch('leave');
	}

	function handleEnter() {
		dispatch('enter', this);
	}
</script>

<button
	class:on-dark={onDark}
	class="shadow"
	data-testid={testId}
	on:click={() => changeTool(value)}
	on:pointerenter={handleEnter}
	on:pointerleave={handleLeave}
>
	<slot />
</button>

<style>
	button {
		align-items: center;
		background-color: white;
		border-radius: 50%;
		border: 0;
		display: flex;
		font-size: 1.25rem;
		justify-content: center;
		margin: 0;
		padding: 0.75rem;
	}

	.on-dark {
		background-color: rgb(42, 41, 41);
		color: white;
	}
</style>
