<script>
  import { View } from 'svench';
  import PsTextInput from './PsTextInput.svelte';
</script>

<View name="Default">
  <PsTextInput />
</View>

<View name="With label">
  <PsTextInput
    placeholder="Placeholder text"
  >
    Label
  </PsTextInput>
</View>

<View name="With label - stacked">
  <PsTextInput
    placeholder="Placeholder text"
    direction="vertical"
  >
    Label
  </PsTextInput>
</View>

<View name="Disabled">
  <PsTextInput
    placeholder="Placeholder text"
    disabled
  >
    Label
  </PsTextInput>
</View>
