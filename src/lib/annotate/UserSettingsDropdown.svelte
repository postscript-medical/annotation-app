<script lang="ts">
	import { gsap } from 'gsap';
	import { resolve } from '$app/paths';
	import Link from '#lib/components/Link.svelte';
	import { userSettingsDropdownDrawerOpen } from '#lib/sketchpad/stores.ts';

	// The user menu (legacy UserSettingsDropdown): the account page and sign out. Legacy's team,
	// subscription and admin links are gone with those features (scope changes); its "Annotate
	// image" link pointed at this page and isn't kept. Drawing on the canvas closes it
	// (`closeUserSettingsDropdown` in the sketchpad).
	let { initial }: { initial: string } = $props();

	function toggle() {
		userSettingsDropdownDrawerOpen.update((open) => !open);
	}

	function tween(node: HTMLElement) {
		const timeline = gsap.timeline({ paused: true });
		timeline
			.from(node, { duration: 0.05, scale: 0, transformOrigin: '100% 0%', ease: 'circ.inOut' })
			.to(node.children, { duration: 0.1, opacity: 1, ease: 'none', stagger: 0.025 }, '+=0.05');
		return {
			duration: timeline.totalDuration() * 1000,
			tick: (t: number) => timeline.progress(t)
		};
	}
</script>

<div class="user-settings-dropdown">
	<button
		class="dropdown-button"
		type="button"
		aria-label="Account menu"
		aria-expanded={$userSettingsDropdownDrawerOpen}
		aria-controls="user-settings-menu"
		onclick={toggle}
	>
		<span class="user-avatar" aria-hidden="true">{initial}</span>
	</button>
	{#if $userSettingsDropdownDrawerOpen}
		<div id="user-settings-menu" class="dropdown shadow" transition:tween>
			<Link href={resolve('/(app)/account')} style="on-dark">Your account</Link>
			<form method="POST" action="/logout">
				<button class="sign-out" type="submit">Sign out</button>
			</form>
		</div>
	{/if}
</div>

<style>
	.user-settings-dropdown {
		display: flex;
		position: relative;
	}

	.dropdown-button {
		background-color: rgb(42, 41, 41);
		border: 0;
		border-radius: 50%;
		color: white;
		padding: 0;
	}

	.dropdown {
		background-color: rgb(42, 41, 41);
		border-radius: 0.5rem;
		display: flex;
		flex-direction: column;
		min-width: 30ch;
		padding: 2rem;
		position: absolute;
		right: 0;
		top: 115%;
		z-index: 1;
	}

	.dropdown > :global(*) {
		opacity: 0;
	}

	.dropdown > :global(:not(:last-child)) {
		margin-bottom: 1rem;
	}

	/* Looks like the links above it; it's a button so signing out is a POST (auth-spec §4.4). */
	.sign-out {
		background: transparent;
		border: 0;
		color: white;
		cursor: pointer;
		font: inherit;
		padding: 0;
		text-align: left;
		text-decoration: underline;
	}

	.user-avatar {
		align-items: center;
		display: flex;
		height: 2rem;
		justify-content: center;
		width: 2rem;
	}
</style>
