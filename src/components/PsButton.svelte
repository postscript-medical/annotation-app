<script>
  import { createEventDispatcher, onMount, onDestroy } from 'Svelte';

  export let inline = false; /* TODO: this should be part of the 'style' prop, to receive either a string with a single or multiple values or an array of strings */
  export let disabled = false;
  export let loading = false;
  export let onDark = false;
  export let style = 'primary';
  export let type = 'button';

  const PATH_LENGTH = 125.7;
  const dispatch = createEventDispatcher();

  let dot;
  let inlineContent;
  let tl;
  let disableButton;

  $: isSecondary = style === 'secondary';
  $: isDisabled = disabled || disableButton;
  $: toggleLoadingAnimation(loading);

  function loop () {
    console.log('PsButton looping:', loading);
    if (loading) {
      gsap
        .timeline({
          onComplete: loop
        })
        .fromTo(dot, {
          strokeDashoffset: PATH_LENGTH,
        },
        {
          duration: 1,
          strokeDashoffset: PATH_LENGTH * 3,
          ease: 'none',
        })

      return;
    };

    gsap
      .timeline({
        onComplete: () => {
          dispatch('tweenOutComplete')
          toggleDisable();
        },
      })
      .to(dot, {
        strokeDashoffset: PATH_LENGTH * 4,
        ease: 'none',
      })
      .to(dot, {
        scale: 0,
        transformOrigin:"50% 50%",
        ease: 'back.in',
      })
      .to(inlineContent, {
        opacity: 1,
        ease: 'circ.in',
      }, '-=0.25');
  }

  function toggleLoadingAnimation(isLoading) {
    if (isLoading) {
      tl.play(0);
    }
  };

  function toggleDisable () {
    disableButton = !disableButton;
  };

  onMount(() => {
    tl = gsap
      .timeline({
        paused: true,
        onComplete: loop,
        onStart: toggleDisable,
      })
      .to(inlineContent, {
        opacity: 0,
        ease: 'none',
      })
      .from(dot, {
        scale: 0,
        transformOrigin:"50% 50%",
        ease: 'back.out',
      }, '-=0.25')
      .fromTo(dot, {
        strokeDashoffset: 0,
      }, {
        strokeDashoffset: PATH_LENGTH,
        ease: 'power1.in',
      })
  });

  onDestroy(() => {

  });
</script>

<button
  class:secondary={ isSecondary }
  class:on-dark={ onDark }
  class:as-link={ inline }
  disabled={ isDisabled }
  { type }
  on:click
>
  <div
    class="loading-content"
  >
    <svg
      viewBox="0 0 100 100"
      width="100"
      height="100"
    >
      <circle
        bind:this={ dot }
        cx="50"
        cy="50"
        r="20"
        stroke-width="6"
        stroke-dasharray={ PATH_LENGTH }
      />
    </svg>
  </div>
  <span
    bind:this={ inlineContent }
    class="inline-content"
  >
    <slot></slot>
  </span>
</button>

<style>
  button {
    background-color: rgb(55, 154, 70);
    border: 2px solid rgb(55,154,70);
    color: white;
    white-space: nowrap;
    position: relative;
    transition: opacity 100ms ease-in-out;
  }

  button :global(*) {
    pointer-events: none;
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

  .on-dark {
    background-color: white;
    color: rgb(42,41,41);
  }

  .secondary {
    background-color: white;
    border-color: rgb(42,41,41);
    color: rgb(42,41,41);
  }

  .as-link {
    background: none;
    padding: 0;
    border: 0;
    text-align: left;
    text-decoration: underline;
  }

  .as-link.on-dark {
    color: white;
  }

  .loading-content {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }
</style>