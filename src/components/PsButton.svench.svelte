<script>
  import { View } from 'svench';
  import PsButton from './PsButton.svelte';

  const BUTTON_COPY = 'Button';
</script>

<View name="Primary button">
  <PsButton>
   { BUTTON_COPY }
  </PsButton>
</View>

<View name="Primary button - disabled">
  <PsButton
    disabled
  >
   { BUTTON_COPY }
  </PsButton>
</View>

<View name="Secondary button">
  <PsButton
    style="secondary"
  >
   { BUTTON_COPY }
  </PsButton>
</View>

<View name="Secondary button - disabled">
  <PsButton
    disabled
    style="secondary"
  >
   { BUTTON_COPY }
  </PsButton>
</View>