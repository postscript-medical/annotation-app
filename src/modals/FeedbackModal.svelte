<script>
  import { user, organization } from "../stores.js";
  import Modal from "./Modal.svelte";

  let feedback;
  let feedbackSent = false;
  let loading = false;
  let tweenComplete = false;

  async function submit_form() {
    loading = true;
    tweenComplete = false;

    const response = await fetch("/.netlify/functions/send-feedback-email", {
      method: "POST",
      body: JSON.stringify({
        from_email: $user.email,
        from_name: $user.user_metadata.full_name || "Unknown",
        org_name: $organization.name,
        message: feedback,
      }),
    }).catch((err) => {
      // Error sending feedback - error will still appear in browser console
      loading = false;
    });

    if (response.status === 200) {
      feedbackSent = true;
    }

    loading = false;
  }

  function tweenOutComplete() {
    tweenComplete = true;
  }
</script>

<Modal
  confirmBtCopy="Send"
  cancelBtCopy="Close"
  hideConfirmButton={feedbackSent && tweenComplete}
  hideCancelButton={!feedbackSent || !tweenComplete}
  {loading}
  on:close
  on:confirm={submit_form}
  on:tween-out-complete={tweenOutComplete}
>
  <span slot="header">
    {#if feedbackSent && tweenComplete}
      Thank you.
    {:else}
      Have some feedback or would like to report a bug?
    {/if}
  </span>

  {#if feedbackSent && tweenComplete}
    Your message has been sent.
  {:else}
    <textarea bind:value={feedback} />
  {/if}
</Modal>

<style>
  textarea {
    resize: vertical;
  }
</style>
