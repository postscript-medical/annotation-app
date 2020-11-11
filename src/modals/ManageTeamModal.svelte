<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import Modal from './Modal.svelte';
  import PsButton from '../components/PsButton.svelte';
  import PsDropdown from '../components/PsDropdown.svelte';

  export let team;
  export let user;

  const dispatch = createEventDispatcher();
  const roles = ['user', 'admin'];

  let teamName;
  let members = [];

  function confirm () {
    dispatch('close');
  };

  onMount(() => {
    teamName = team.name;
    members = team.members.filter(({ email }) => email !== user.email);
  });
</script>

<Modal
  on:close
>
  <h2
    slot="header"
  >
    Team management
  </h2>

  <form>
    <label for="team-name">Team name</label>
    <input type="text" bind:value={ teamName }>
    { #each members as { email, firstName, lastName, role } }
      <label for={ `email-${email}`}>Email</label>
      <input type="text" bind:value={ email }>
      <label for={ `first-name-${firstName}`}>First name</label>
      <input type="text" bind:value={ firstName }>
      <label for={ `last-name-${lastName}`}>Last name</label>
      <input type="text" bind:value={ lastName }>
      <PsDropdown
        label="Role"
        options={ roles }
        selected={ roles[0] }
      />
    { /each }
  </form>

  <PsButton
    style='secondary'
  >
    Add user
  </PsButton>

  <PsButton 
    autofocus
    on:click={ confirm }
  >
    Save
  </PsButton>
</Modal>