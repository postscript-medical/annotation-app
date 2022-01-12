<script>
  import { View } from "svench";
  import PsTextInput from "./PsTextInput.svelte";

  let someValue = "Some value";

  function updateInput({ detail }) {
    someValue = detail;
  }
</script>

<View name="Default">
  <PsTextInput />
</View>

<View name="With label">
  <PsTextInput placeholder="Placeholder text">Label</PsTextInput>
</View>

<View name="With label - stacked">
  <PsTextInput placeholder="Placeholder text" style="vertical">
    Label
  </PsTextInput>
</View>

<View name="Disabled">
  <PsTextInput placeholder="Placeholder text" disabled>Label</PsTextInput>
</View>

<View name="Read only">
  <PsTextInput placeholder="Placeholder text" readonly>Label</PsTextInput>
</View>

<View name="Inline">
  <PsTextInput
    placeholder="Placeholder text"
    style="inline vertical"
    value={someValue}
    on:input={updateInput}
  >
    Label
  </PsTextInput>
</View>

<View name="Inline - disabled">
  <PsTextInput
    placeholder="Placeholder text"
    style="inline"
    disabled
    value={someValue}
  >
    Label
  </PsTextInput>
</View>

<View name="Inline - read only">
  <PsTextInput placeholder="Placeholder text" style="inline" readonly />
</View>
