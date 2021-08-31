<script>
  import { createEventDispatcher } from "svelte";

  export let disabled = false;
  export let placeholder = "";
  export let readonly = false;
  export let style =
    "horizontal"; /* options: ['inline', 'horizontal'|'vertical'] */
  export let tags;

  const dispatch = createEventDispatcher();

  $: labelClass = `
    container
    ${style}
    ${disabled ? "disabled" : ""}
  `.trim();

  function onInput({ target }) {
    const array = target.value.split(",");

    dispatch("input", array);
  }

  function onBlur(event) {
    // Create the visual tags
  }
</script>

<label class={labelClass}>
  <span>
    <slot />
  </span>
  <input
    {placeholder}
    {readonly}
    type="text"
    value={tags}
    on:input={onInput}
    on:blur={onBlur} />
</label>

<style>
  input:read-only {
    border-color: transparent;
    background-color: transparent;
  }

  span {
    flex-shrink: 0;
  }

  .container {
    display: flex;
    align-items: flex-start;
  }

  .inline :global(input) {
    border-left: 0;
    border-right: 0;
    border-top: 0;
    border-radius: 0;
    padding: 0;
    flex: 0 auto;
    line-height: 1.5;
  }

  .disabled {
    opacity: 0.5;
  }

  .horizontal {
    flex-direction: row;
    align-items: baseline;
  }
  .inline > :not(:last-child):not(:empty),
  .horizontal > :not(:last-child):not(:empty) {
    margin-right: 0.5rem;
  }

  .vertical {
    flex-direction: column;
  }
  .vertical > :not(:last-child):not(:empty) {
    margin-bottom: 0.25rem;
  }
</style>
