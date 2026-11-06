<script lang="ts">
	import { gsap } from 'gsap';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	// The app's button (legacy PsButton). `style`: "primary" (default), "secondary", "tertiary" or
	// "danger" (destructive actions; new), plus "inline" and/or "on-dark". While `loading`, the label fades into a spinning dot and the
	// button is disabled; `ontweenoutcomplete` fires when the dot has gone again.
	type Props = {
		style?: string;
		loading?: boolean;
		ontweenoutcomplete?: () => void;
		children: Snippet;
	} & Omit<HTMLButtonAttributes, 'style' | 'children'>;

	let {
		style = 'primary',
		type = 'button',
		disabled = false,
		loading = false,
		ontweenoutcomplete,
		children,
		...rest
	}: Props = $props();

	const PATH_LENGTH = 125.7;

	let dot: SVGCircleElement | undefined = $state();
	let content: HTMLSpanElement | undefined = $state();
	let animating = $state(false);
	let intro: gsap.core.Timeline | undefined;

	function loop() {
		if (loading) {
			gsap
				.timeline({ onComplete: loop })
				.fromTo(
					dot!,
					{ strokeDashoffset: PATH_LENGTH },
					{ duration: 1, strokeDashoffset: PATH_LENGTH * 3, ease: 'none' }
				);
			return;
		}
		gsap
			.timeline({
				onComplete: () => {
					animating = false;
					ontweenoutcomplete?.();
				}
			})
			.to(dot!, { strokeDashoffset: PATH_LENGTH * 4, ease: 'none' })
			.to(dot!, { scale: 0, transformOrigin: '50% 50%', ease: 'back.in' })
			.to(content!, { opacity: 1, ease: 'circ.in' }, '-=0.25');
	}

	$effect(() => {
		if (!dot || !content) return;
		intro = gsap
			.timeline({ paused: true, onStart: () => (animating = true), onComplete: loop })
			.to(content, { opacity: 0, ease: 'none' })
			.fromTo(
				dot,
				{ scale: 0, transformOrigin: '50% 50%' },
				{ scale: 1, ease: 'back.out' },
				'-=0.25'
			)
			.fromTo(dot, { strokeDashoffset: 0 }, { strokeDashoffset: PATH_LENGTH, ease: 'power1.in' });
		return () => intro?.kill();
	});

	$effect(() => {
		if (loading && intro && !animating) intro.play(0);
	});
</script>

<button class={style} {type} disabled={disabled || loading || animating} {...rest}>
	<span class="loading-content" aria-hidden="true">
		<svg viewBox="0 0 100 100" width="100" height="100">
			<circle
				bind:this={dot}
				cx="50"
				cy="50"
				r="20"
				stroke-width="6"
				stroke-dasharray={PATH_LENGTH}
			/>
		</svg>
	</span>
	<span bind:this={content} class="inline-content">
		{@render children()}
	</span>
</button>

<style>
	button {
		background-color: var(--color-brand);
		border: 2px solid var(--color-brand);
		color: var(--color-white);
		white-space: nowrap;
		position: relative;
		transition: opacity var(--duration-fast) ease-in-out;
	}

	button :global(*) {
		pointer-events: none;
	}

	button:focus {
		background-color: var(--color-ink-pressed);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	svg {
		width: 100%;
		height: 100%;
		fill: none;
		stroke: currentColor;
	}

	/* Hidden (also before hydration) until the loading animation scales it in. */
	circle {
		transform: scale(0);
		transform-origin: 50% 50%;
	}

	.on-dark {
		background-color: var(--color-white);
		border-color: var(--color-white);
		color: var(--color-ink);
	}

	.secondary {
		background-color: var(--color-white);
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.danger {
		background-color: var(--color-danger);
		border-color: var(--color-danger);
		color: var(--color-white);
	}

	.tertiary {
		border-radius: var(--radius-pill);
		color: var(--color-white);
		line-height: 1.5;
	}

	.inline {
		background: none;
		padding: 0;
		border: 0;
		text-align: left;
		text-decoration: underline;
	}

	.inline.on-dark {
		color: var(--color-white);
	}

	.loading-content {
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		inset: 0;
	}
</style>
