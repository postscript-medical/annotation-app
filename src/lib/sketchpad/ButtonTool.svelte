<svelte:options runes={false} />

<!-- Ported as-is (2.1) from legacy components/sketchpad; legacy (non-runes) mode until 2.8. -->
<script>
	// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.8).
	import { createEventDispatcher } from 'svelte';
	import { gsap } from 'gsap';
	import { closeUserSettingsDropdown, toolDrawerOpen, viewportType } from './stores.js';
	import { VIEWPORT_PHONE, VIEWPORT_TABLET } from './constants.js';
	import ButtonIcon from './ButtonIcon.svelte';
	import Tooltip from '../components/Tooltip.svelte';

	export let toolName;
	export let tooltip = '';
	export let primaryValue = '';
	export let secondaryTools = [];
	export let secondaryValue = '';

	const dispatch = createEventDispatcher();

	let position = { x: 0, y: 0 };
	let secondaryToolsContainer;
	let showTooltip = false;

	$: openDrawer = $toolDrawerOpen === toolName;
	$: isSelected = primaryValue === toolName;
	$: showSecondaryTools = openDrawer && secondaryTools.length > 0 && isSelected;

	function changePrimary({ detail: newTool }) {
		$toolDrawerOpen = toolName;

		closeUserSettingsDropdown();

		showTooltip = false;

		if (secondaryTools.length < 1) {
			dispatch('change-primary', newTool);

			return;
		}

		if (!isSelected) {
			dispatch('change-primary', newTool);
		}

		if (showSecondaryTools) {
			$toolDrawerOpen = '';
		}
	}

	function changeSecondary(value, id) {
		closeUserSettingsDropdown();

		dispatch('change-secondary', { value, id });
	}

	function handleEnter({ detail: element }) {
		const { left, top, width, height } = element.getBoundingClientRect();

		position = {
			x: left + width,
			y: top + height * 0.5
		};

		showTooltip = true;
	}

	function handleLeave() {
		showTooltip = false;
	}

	function tween(node) {
		const tl = gsap.timeline({ paused: true });
		let scale = 'scaleX';
		let scaleDirection = '0% 0%';
		let move = 'xPercent';
		let moveDirection = -50;

		if ([VIEWPORT_PHONE, VIEWPORT_TABLET].find((type) => type === $viewportType)) {
			scale = 'scaleY';
			scaleDirection = '0% 100%';
			move = 'yPercent';
			moveDirection = 50;

			gsap.set(node, { yPercent: -100 });
		}

		tl.from(secondaryToolsContainer, {
			duration: 0.15,
			[scale]: 0,
			transformOrigin: scaleDirection,
			ease: 'circ.inOut'
		}).from(
			secondaryToolsContainer.children,
			{
				duration: 0.15,
				opacity: 0,
				[move]: moveDirection,
				ease: 'circ.inOut',
				stagger: 0.05
			},
			'-=0.075'
		);

		const duration = tl.totalDuration();

		return {
			duration: duration * 1000,
			tick: (t) => {
				tl.progress(t);
			}
		};
	}
</script>

<div class="primary-tool">
	<ButtonIcon
		testId={toolName}
		on:click={changePrimary}
		on:enter={handleEnter}
		on:leave={handleLeave}
		onDark={isSelected}
		value={toolName}
	>
		<slot onDark={isSelected}>!!</slot>
	</ButtonIcon>
	{#if showSecondaryTools}
		<div bind:this={secondaryToolsContainer} class="secondary-tools shadow" transition:tween>
			{#each secondaryTools as secondaryTool (secondaryTool.id)}
				<label id={secondaryTool.id} class:on-dark={secondaryTool.value === secondaryValue}>
					<input
						name={'secondary-' + toolName}
						type="radio"
						value={secondaryTool.value}
						on:change={() => changeSecondary(secondaryTool.value, secondaryTool.id)}
					/>
					<slot
						name="secondary-tool"
						onDark={secondaryTool.value === secondaryValue}
						{secondaryTool}
					/>
				</label>
			{/each}
		</div>
	{/if}

	{#if tooltip && showTooltip}
		<Tooltip x={position.x} y={position.y}>
			{tooltip}
		</Tooltip>
	{/if}
</div>

<style>
	.primary-tool {
		position: relative;
	}

	.primary-tool:last-child {
		margin-bottom: 0;
	}

	.secondary-tools {
		background-color: white;
		border-radius: 0.375rem;
		display: flex;
		flex-direction: column;
		padding: 0.375rem;
		position: absolute;
		left: 0;
		top: -15%;
		overflow: hidden;
	}

	.secondary-tools > :global(*) {
		background-color: white;
		border: 0;
		border-radius: 0.25rem;
	}
	.secondary-tools > :global(:not(:last-child)) {
		margin-bottom: 0.5rem;
	}

	.secondary-tools > :global(*.on-dark) {
		background-color: rgb(42, 41, 41);
		color: white;
	}

	@media screen and (min-width: 900px) {
		.secondary-tools {
			/* flex-direction: column; */
			left: 115%;
			top: 0;
		}
	}
</style>
