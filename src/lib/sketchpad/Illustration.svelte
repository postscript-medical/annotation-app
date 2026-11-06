<!-- From legacy components/sketchpad. Images come through the first-party /images proxy (G7, 2.4). -->
<script lang="ts">
	import { gsap } from 'gsap';
	import { illustrationUrl } from '../images.ts';
	import { illustrationDisplayed } from './stores.ts';

	let { name = '' }: { name?: string } = $props();

	const src = $derived(illustrationUrl(name));

	function imageLoaded() {
		gsap.to($illustrationDisplayed!, {
			duration: 0.15,
			opacity: 1,
			ease: 'power4.in'
		});
	}
</script>

<img bind:this={$illustrationDisplayed} {src} alt="" crossorigin="anonymous" onload={imageLoaded} />

<style>
	img {
		display: block;
		width: 100%;
		height: auto;
		opacity: 0;
	}
</style>
