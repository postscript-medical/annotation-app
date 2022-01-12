<script>
  import "whatwg-fetch";
  import { onMount } from "svelte";
  import { querystring } from "svelte-spa-router";
  import { session } from "../stores";
  import PsHeader from "../components/PsHeader.svelte";
  import PsLink from "../components/PsLink.svelte";

  const searchParams = new URLSearchParams($querystring);
  const token = searchParams.get("token");
  const duration = 0.15;

  let email;
  let errorMessage;
  let userConfirmed = false;

  async function confirm_user_sign_up(token) {
    if (token) {
      let response;

      /**
       * NOTE: Confirm sign up is always called from the main deployed
       * site. We need to find a way to trigger it via a localhost or staging
       * option
       */
      try {
        response = await $session.confirm(token).catch((err) => {
          /* .catch() does not work on IE11 */
          errorMessage = err.json.msg;
        });
      } catch {
        errorMessage = "There was an unknown error";
      }

      if (!response) return;

      email = response.email;
    }

    userConfirmed = true;
  }

  function tween_in(element) {
    const tl = gsap.from(element, {
      autoAlpha: 0,
      delay: duration * 0.75,
      duration,
      ease: "none",
    });

    return {
      /* GSAP's duration is in seconds. Svelte's is in miliseconds */
      duration: tl.totalDuration() * 1000,
      tick: (t) => {
        tl.progress(t);
      },
    };
  }

  function tween_out(element) {
    const tl = gsap.timeline();

    tl.set(element, {
      position: "absolute",
    }).to(element, {
      autoAlpha: 0,
      duration,
      ease: "none",
    });

    return {
      /* GSAP's duration is in seconds. Svelte's is in miliseconds */
      duration: tl.totalDuration() * 1000,
      tick: (_, u) => {
        tl.progress(u);
      },
    };
  }

  onMount(() => {
    confirm_user_sign_up(token);
  });
</script>

<PsHeader />

<main class="central-align main-content" in:tween_in out:tween_out>
  {#if userConfirmed}
    <h1>Thank you</h1>

    <p>Your email is confirmed.</p>

    <p>
      Please <PsLink href="/#" style="on-dark">log in to your account</PsLink> to
      securely input your payment information.
    </p>
  {:else if errorMessage}
    <h1>Something went wrong</h1>

    <p>
      <strong>{errorMessage}</strong>. Please <PsLink
        href="mailto:accounts@postscriptmedical.com"
        style="on-dark">get in touch</PsLink
      >.
    </p>
  {:else}
    <h1>Please wait</h1>

    <p>We are confiming your details.</p>
  {/if}
</main>

<style>
  /* Base styling */
  main {
    color: #fff;
    max-width: 40rem;
  }
</style>
