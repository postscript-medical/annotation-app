<script>
  import { View } from 'svench';
  import ManageTeamModal from './ManageTeamModal.svelte';
  import PsButton from '../components/PsButton.svelte';

  const BUTTON_COPY = 'Open modal';
  const DEFAULT = 'default';
  const MAX_USERS = 10;
  let members = [
    {
      email: 'email@address.com',
      firstName: 'Joey',
      lastName: 'Passadena',
      role: 'user',
    },
    {
      email: 'address@address.com',
      firstName: 'Ma',
      lastName: 'Darling',
      role: 'user',
    },
  ];
  let teamName = 'My team';
  let owner = {
    email: 'another@address.com',
    firstName: 'OwnerName',
    lastName: 'LastName',
    role: 'owner',
  };
  let modalToOpen = DEFAULT;
  let loading = false;
  let errorMessage;

  function openModal (modalName) {
    modalToOpen = modalName;
  };

  function closeModal () {
    modalToOpen = '';

    members = members.filter(({ toInvite }) => !toInvite);
  };

  function addNewTeamMember (teamMember) {
    members = [
      ...members,
      teamMember,
    ];
  };

  function clearErrorMessage () {
    errorMessage = '';
  };

  function fakeRequest (callback) {
    loading = true;

    setTimeout(() => {
      loading = false;

      if (callback) callback();
    }, 2000);
  }

  function removeTeamMember (teamMember) {
    // Removes a teamMember that has not been created in the DB if one exists
    if (teamMember.toInvite) {
      members = members.filter(({ toInvite }) => !toInvite );

      return;
    };

    fakeRequest(() => {
      members = members.filter(({ email }) => {
        return email !== teamMember.email;
      });
    });
  };

  function saveNewTeamMember (teamMember) {
    clearErrorMessage();

    fakeRequest(() => {
      if (!teamMember.email) {
        errorMessage = 'You must provide a valid email address.';
  
        return;
      };
  
      const currentMembers = members.slice(0, -1);
  
      if (!!currentMembers.find( ({ email }) => email.toLowerCase() === teamMember.email.toLowerCase())) {
        errorMessage = 'You must use an unique email address.';
  
        return;
      };

      const updatedMembers = [...members];

      updatedMembers.forEach(member => {
        delete member.toInvite;
      });

      members = updatedMembers;
    });
  };

  function saveUpdatedTeamMember (teamMember) {
    // We will trust the API to prevent us adding an email that already exists
    fakeRequest(() => {
      members.forEach(member => {
        if (member.email === teamMember.email) {
          member = teamMember;
        }
      });
    });
  };

  function saveUpdatedTeamName (name) {
    fakeRequest();
  };

  function updateTeamMember (teamMember, index) {
    const updatedMembers = [ ...members ];

    updatedMembers.splice(index, 1, teamMember);

    members = updatedMembers;
  };

  function updateTeamName ({ detail: name }) {
    teamName = name;
  };

  function handleTeamUpdate ({ detail }) {
    const { teamMember, action, index } = detail;

    switch (action) {
      case 'add-new-team-member':
        addNewTeamMember(teamMember);
        break;

      case 'update-team-member':
        updateTeamMember(teamMember, index);
        break;

      case 'remove-team-member':
        removeTeamMember(teamMember);
        break;

      case 'save-new-team-member':
        saveNewTeamMember(teamMember);
        break;

      case 'save-updated-team-member':
        saveUpdatedTeamMember(teamMember, index);
        break;

      case 'save-updated-team-name':
        saveUpdatedTeamName(teamName);
        break;
    }
  };
</script>

<View name="Default">
  <div
    class="modal-container"
  >
    <PsButton
      on:click={ () => openModal(DEFAULT) }
    >
      { BUTTON_COPY }
    </PsButton>
    { #if modalToOpen === DEFAULT }
      <ManageTeamModal
        { errorMessage }
        { loading }
        { members }
        { teamName }
        maxTeamMembers={ MAX_USERS }
        on:close={ closeModal }
        on:update={ handleTeamUpdate }
        on:update-team-name={ updateTeamName }
      />
    { /if }
  </div>
</View>

<style>
  .modal-container {
    min-width: 60rem;
    min-height: 40rem;
    display: flex;
    justify-content: center;
    align-items: center;
    transform: translate(0,0);
  }
</style>