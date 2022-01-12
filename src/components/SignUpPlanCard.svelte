<script>
  import { createEventDispatcher } from "svelte";

  export let showYearlyPlans = false;
  export let plan;
  export let specialties = [];

  const dispatch = createEventDispatcher();

  let selectedSpecialties = plan.is_premium
    ? specialties.map(({ id }) => id)
    : specialties[0].id;

  $: priceId = showYearlyPlans ? plan.priceId_yearly : plan.priceId_monthly;

  function handleSubmit(event) {
    event.preventDefault();

    dispatch("submit", { specialties: selectedSpecialties, priceId });
  }
</script>

<form action="" on:submit={handleSubmit}>
  <p class="plan-name">{plan.name}</p>

  <p class="price">
    £{showYearlyPlans ? plan.price * 10 : plan.price}<span
      class="billing-frequency"
    >
      /{showYearlyPlans ? "Per year" : "Per month"}</span
    >
  </p>

  <input type="hidden" name="priceId" bind:value={priceId} />

  <fieldset>
    <legend>
      {#if plan.is_premium}
        Included specialties:
      {:else}
        Choose a specialty:
      {/if}
    </legend>

    {#each specialties as { id, name }, index}
      {#if plan.is_premium}
        <label class="inactive">
          <input
            type="checkbox"
            name="specialties"
            value={id}
            bind:group={selectedSpecialties}
          />

          {name}
        </label>
      {:else}
        <label>
          <input
            type="radio"
            name="specialties"
            value={id}
            bind:group={selectedSpecialties}
          />

          {name}
        </label>
      {/if}
    {/each}
  </fieldset>

  <button type="submit"> Choose </button>
</form>

<style>
  button {
    background-color: #379a46;
    border: none;
    border-radius: 2em;
    box-shadow: 0 0.125rem 0.25rem #a1a1a1;
    color: #fff;
  }

  form > :not(:last-child) {
    margin-bottom: 1rem;
  }

  fieldset {
    border: none;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    text-align: left;
  }

  input[type="radio"] {
    height: auto;
    opacity: 1;
    position: static;
    width: auto;
  }

  label.inactive,
  input[type="checkbox"] {
    pointer-events: none;
  }

  .plan-name {
    font-size: 1.33rem;
    font-weight: 700;
  }

  .price {
    font-size: 2.36rem;
    font-weight: 600;
    line-height: 1;
  }

  .billing-frequency {
    text-transform: uppercase;
    color: #a1a1a1;
    font-size: 0.3em;
  }
</style>
