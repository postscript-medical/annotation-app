<script>
  import { createEventDispatcher } from "svelte";

  export let card;
  export let specialties;

  const dispatch = createEventDispatcher();

  /**
   * Because we need to retain the object, we convert it to a string
   * so we can use it as a value in the group binding. Later we parse
   * this string back into an Object before dispatching the update event.
   */
  let selectedSpecialties = card.specialties.map((entry) => {
    return JSON.stringify(entry);
  });
  let selectedSubSpecialties = card.subSpecialties.map((entry) => {
    return JSON.stringify(entry);
  });

  $: filteredSpecialties = specialties.filter((specialty) => {
    return selectedSpecialties.find(
      (entry) => JSON.parse(entry).id === specialty.id
    );
  });

  function handleSpecialtyChange(event) {
    if (!event.target.checked) {
      const _specialty = specialties.find(
        ({ id }) => id === JSON.parse(event.target.value).id
      );
      const _subSpecialties = _specialty.subSpecialties;

      _subSpecialties.forEach(({ id }) => {
        const index = selectedSubSpecialties.findIndex(
          (entry) => JSON.parse(entry).id === id
        );

        if (index >= 0) selectedSubSpecialties.splice(index, 1);
      });

      handleCheckboxChange("subSpecialties", selectedSubSpecialties);
    }

    handleCheckboxChange("specialties", selectedSpecialties);
  }

  function handleCheckboxChange(key, values) {
    const parsedValues = values.map((entry) => JSON.parse(entry));
    dispatch("change", { key, value: parsedValues });
  }
</script>

<div>
  {#each specialties as specialty}
    <label>
      <input
        type="checkbox"
        bind:group={selectedSpecialties}
        on:change={handleSpecialtyChange}
        value={JSON.stringify({ id: specialty.id, name: specialty.name })}
      />
      {specialty.name}
    </label>
  {/each}
</div>

<div>
  {#each filteredSpecialties as specialty}
    <dl>
      <dt>
        {specialty.name}
      </dt>

      {#each specialty.subSpecialties as subSpecialty}
        <dd>
          <label>
            <input
              type="checkbox"
              bind:group={selectedSubSpecialties}
              on:change={() =>
                handleCheckboxChange("subSpecialties", selectedSubSpecialties)}
              value={JSON.stringify({
                id: subSpecialty.id,
                name: subSpecialty.name,
              })}
            />
            {subSpecialty.name}
          </label>
        </dd>
      {/each}
    </dl>
  {/each}
</div>
