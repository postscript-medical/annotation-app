<script>
  import { View } from 'svench';
  import ManageTeamModal from './ManageTeamModal.svelte';
  import PsButton from '../components/PsButton.svelte';

  const MANAGE_TEAM = 'manageTeam';
  const MAX_USERS = 10;
  const BUTTON_COPY = 'Open modal';
  const team = {
    name: 'My team',
    members: [
      {
        email: 'email@address.com',
        firstName: 'Joey',
        lastName: 'Passadena',
      },
      {
        email: 'address@address.com',
        firstName: 'Ma',
        lastName: 'Darling',
      },
    ]
  };
  const user = {
    email: 'another@address.com',
  };
  let modalToOpen = '';

  function openModal (modalName) {
    modalToOpen = modalName
  }

  function closeModal () {
    modalToOpen = ''
  }
</script>

<View name="Manage Team">
  <PsButton
    on:click={ openModal(MANAGE_TEAM) }
  >
    { BUTTON_COPY }
  </PsButton>
  { #if modalToOpen === MANAGE_TEAM }
    <ManageTeamModal
      { team }
      { user }
      maxUsers={ MAX_USERS }
      on:close={ closeModal }
    />
  { /if }
</View>