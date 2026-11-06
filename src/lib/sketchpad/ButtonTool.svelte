<!-- From legacy components/sketchpad. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TransitionConfig } from 'svelte/transition';
	import { gsap } from 'gsap';
	import { closeUserSettingsDropdown, toolDrawerOpen, viewportType } from './stores.ts';
	import { VIEWPORT_PHONE, VIEWPORT_TABLET } from './constants.ts';
	import type { SecondaryTool } from './types.ts';
	import ButtonIcon from './ButtonIcon.svelte';
	import Tooltip from '../components/Tooltip.svelte';

	type Props = {
		toolName: string;
		tooltip?: string;
		primaryValue?: string;
		secondaryTools?: SecondaryTool[];
		secondaryValue?: number | string;
		onchangeprimary?: (toolName: string) => void;
		onchangesecondary?: (tool: { value: number | string; id: string }) => void;
		children: Snippet;
		secondaryTool?: Snippet<[SecondaryTool]>;
	};

	let {
		toolName,
		tooltip = '',
		primaryValue = '',
		secondaryTools = [],
		secondaryValue = '',
		onchangeprimary,
		onchangesecondary,
		children,
		secondaryTool
	}: Props = $props();

	let position = $state({ x: 0, y: 0 });
	let showTooltip = $state(false);

	const openDrawer = $derived($toolDrawerOpen === toolName);
	const isSelected = $derived(primaryValue === toolName);
	const showSecondaryTools = $derived(openDrawer && secondaryTools.length > 0 && isSelected);

	function changePrimary() {
		// Read before anything changes: a press toggles the drawer as it was when pressed, and these
		// are derived, so they'd follow the store as soon as it's set below.
		const wasSelected = isSelected;
		const wasShowing = showSecondaryTools;

		$toolDrawerOpen = toolName;

		closeUserSettingsDropdown();

		showTooltip = false;

		if (secondaryTools.length < 1) {
			onchangeprimary?.(toolName);

			return;
		}

		if (!wasSelected) {
			onchangeprimary?.(toolName);
		}

		if (wasShowing) {
			$toolDrawerOpen = '';
		}
	}

	function changeSecondary(value: number | string, id: string) {
		closeUserSettingsDropdown();

		onchangesecondary?.({ value, id });
	}

	function handleEnter(element: HTMLElement) {
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

	function tween(node: HTMLElement): TransitionConfig {
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

		tl.from(node, {
			duration: 0.15,
			[scale]: 0,
			transformOrigin: scaleDirection,
			ease: 'circ.inOut'
		}).from(
			node.children,
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
		onclick={changePrimary}
		onenter={handleEnter}
		onleave={handleLeave}
		onDark={isSelected}
		value={toolName}
	>
		{@render children()}
	</ButtonIcon>
	{#if showSecondaryTools}
		<div class="secondary-tools shadow" transition:tween>
			{#each secondaryTools as tool (tool.id)}
				<label id={tool.id} class:on-dark={tool.value === secondaryValue}>
					<input
						name={'secondary-' + toolName}
						type="radio"
						value={tool.value}
						onchange={() => changeSecondary(tool.value, tool.id)}
					/>
					{@render secondaryTool?.(tool)}
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
