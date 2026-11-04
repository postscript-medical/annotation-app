<script lang="ts">
	import { gsap } from 'gsap';
	import Logo from './Logo.svelte';

	// A full-screen "loading" cover with the logo (legacy LoadingOverlay).
	let { loading = false }: { loading?: boolean } = $props();

	let copy: HTMLDivElement | undefined = $state();

	/** The legacy GSAP intro, driven by Svelte's transition clock (plays in reverse on the way out). */
	function tween(node: HTMLElement) {
		const timeline = gsap.timeline({ paused: true });
		const logo = node.querySelector('.main-logo');
		timeline
			.from(node, { duration: 0.1, opacity: 0, ease: 'none' })
			.from(
				[logo, copy],
				{ duration: 0.3, y: 5, opacity: 0, stagger: 0.05, ease: 'power4.inOut' },
				'-=0.05'
			);
		return {
			duration: timeline.totalDuration() * 1000,
			tick: (t: number) => {
				timeline.progress(t);
			}
		};
	}
</script>

{#if loading}
	<div class="wrapper" transition:tween data-testid="loading-overlay" role="status">
		<Logo showName style="large full-color" />
		<div bind:this={copy}>loading</div>
	</div>
{/if}

<style>
	.wrapper {
		align-items: center;
		background-color: rgb(255, 255, 255);
		color: black;
		display: flex;
		flex-direction: column;
		font-size: 1.5rem;
		height: 100%;
		justify-content: center;
		left: 0;
		position: fixed;
		top: 0;
		text-transform: uppercase;
		width: 100%;
		z-index: 10;
	}

	.wrapper > :global(:not(:last-child)) {
		margin-bottom: 1rem;
	}
</style>
