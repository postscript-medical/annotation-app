<script>
  import { View } from 'svench';
  import PsButton from './PsButton.svelte';

  const buttonCopy = 'Button';
</script>

<View name="Primary button">
  <PsButton>
   { buttonCopy }
  </PsButton>
</View>

<View name="Primary button - disabled">
  <PsButton
    disabled
  >
   { buttonCopy }
  </PsButton>
</View>

<View name="Secondary button">
  <PsButton
    style="secondary"
  >
   { buttonCopy }
  </PsButton>
</View>

<View name="Secondary button - disabled">
  <PsButton
    disabled
    style="secondary"
  >
   { buttonCopy }
  </PsButton>
</View>