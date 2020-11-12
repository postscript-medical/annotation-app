<script>
  import { View } from 'svench';
  import PsDropdown from './PsDropdown.svelte';

  const stringOptions = [
    'One',
    'Two',
    'Three',
  ];
</script>

<View name="Default">
  <PsDropdown
    options={ stringOptions }
  />
</View>

<View name="With label">
  <PsDropdown
    options={ stringOptions }
  >
    Label
  </PsDropdown>
</View>


<View name="With label - stacked">
  <PsDropdown
    direction="vertical"
    options={ stringOptions }
  >
    One Label
  </PsDropdown>
</View>

<View name="Disabled">
  <PsDropdown
    disabled
    options={ stringOptions }
  >
    Label
  </PsDropdown>
</View>