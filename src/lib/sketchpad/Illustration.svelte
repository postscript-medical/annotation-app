<svelte:options runes={false} />

<!-- Ported as-is (2.1) from legacy components/sketchpad; legacy (non-runes) mode until 2.8.
     The image path depends on how Cloudinary illustrations are served (G7, 2.3/2.4). -->
<script module>
	// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.8).
	import { gsap } from 'gsap';

	let target;

	export function tweenOut(callback) {
		gsap.to(target, {
			duration: 0.15,
			opacity: 0,
			onComplete: () => {
				callback();
			}
		});
	}
</script>

<script>
	// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.8).
	import { onMount, onDestroy } from 'svelte';
	import { illustrationDisplayed } from './stores.js';

	export let name = '';

	$: src = 'images/annotation-app/illustrations/' + name;

	async function imageLoaded() {
		gsap.to($illustrationDisplayed, {
			duration: 0.15,
			opacity: 1,
			ease: 'power4.in'
		});
	}

	onMount(() => {
		target = $illustrationDisplayed;

		$illustrationDisplayed.addEventListener('load', imageLoaded);
	});

	onDestroy(() => {
		$illustrationDisplayed.removeEventListener('load', imageLoaded);
	});
</script>

<img bind:this={$illustrationDisplayed} {src} alt="" crossOrigin="anonymous" />

<style>
	img {
		display: block;
		width: 100%;
		height: auto;
		opacity: 0;
	}
</style>
