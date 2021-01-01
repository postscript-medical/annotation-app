<script>
  /*global gsap*/
  /*eslint no-undef: "error"*/

  import PsLogo from "./PsLogo.svelte";

  export let loading = false;

  let copy;

  function tween(node) {
    const tl = gsap.timeline({ paused: true });
    const wrapper = node;
    const logo = node.querySelector(".main-logo");

    tl.from(wrapper, {
      duration: 0.1,
      opacity: 0,
      ease: "none",
    }).from(
      [logo, copy],
      {
        duration: 0.3,
        y: 5,
        opacity: 0,
        stagger: 0.05,
        ease: "power4.inOut",
      },
      `-=0.05`
    );

    const duration = tl.totalDuration();

    return {
      duration: duration * 1000,
      tick: (t) => {
        tl.progress(t);
      },
    };
  }
</script>

{#if loading}
  <div class="wrapper" transition:tween>
    <PsLogo showName size="large" />
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
