<script>
  import { createEventDispatcher } from "svelte";

  import ErrorMessage from "../components/ErrorMessage.svelte";
  import Modal from "./Modal.svelte";
  import PsTextInput from "../components/PsTextInput.svelte";

  import { user } from "../stores";

  import netlifyFunction from "../methods/netlify-function";

  const dispatch = createEventDispatcher();

  let email = "";
  let error = "";
  let loading = false;
  let orgName = "";
  let saveComplete = false;

  async function inviteOrg() {
    loading = true;
    saveComplete = false;

    const response = await netlifyFunction(
      "/.netlify/functions/invite-organization",
      $user,
      {
        body: {
          email,
          orgName,
        },
      }
    )
      .then(() => {
        saveComplete = true;
      })
      .catch((err) => {
        error = err;
      })
      .finally(() => {
        loading = false;
      });
  }

  function tweenOutComplete() {
    if (saveComplete) {
      dispatch("invitation-complete");
    }
  }
</script>

<Modal
  {loading}
  on:close
  on:confirm={inviteOrg}
  on:tween-out-complete={tweenOutComplete}
>
  <svelte:fragment slot="header">Invite new organization</svelte:fragment>

  {#if error}
    <ErrorMessage message={error} />
  {/if}

  <PsTextInput
    value={email}
    style="vertical"
    on:input={({ detail }) => (email = detail)}
  >
    Owner's email:
  </PsTextInput>

  <PsTextInput
    value={orgName}
    style="vertical"
    on:input={({ detail }) => (orgName = detail)}
  >
    Organization name:
  </PsTextInput>
</Modal>
