<script>
  import { user, organization } from "../stores.js";
  import Modal from "./Modal.svelte";
  import PsButton from "../components/PsButton.svelte";

  let feedback;
  let feedbackSent = false;
  let loading = false;
  let tweenComplete = false;

  async function submit_form() {
    loading = true;
    tweenComplete = false;
    await emailjs
      .send("5609467", "feedback_form", {
        from_email: $user.email,
        from_name: $user.user_metadata.full_name || "Admininstrator",
        org_name: $organization.name,
        message: feedback,
      })
      .catch((err) => {
        console.log(err);
        loading = false;
        return;
      });

    feedbackSent = true;
    loading = false;
  }

  function tweenOutComplete() {
    console.log("tweenOut");
    tweenComplete = true;
  }
</script>

<Modal hideCancelButton hideConfirmButton on:close on:confirm={submit_form}>
  <span slot="header">
    {#if feedbackSent && tweenComplete}
      Thank you.
    {:else}Have some feedback or would like to report a bug?{/if}
  </span>

  {#if feedbackSent && tweenComplete}
    Your message has been sent.
  {:else}
    <textarea bind:value={feedback} />

    <PsButton {loading} type="submit" on:tween-out-complete={tweenOutComplete}>
      Send
    </PsButton>
  {/if}
</Modal>

<style>
  textarea {
    resize: vertical;
  }
</style>
