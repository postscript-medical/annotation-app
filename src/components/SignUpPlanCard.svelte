<script>
  import { createEventDispatcher } from "svelte";

  export let plan;

  const dispatch = createEventDispatcher();

  let locale = "gbp";

  function handleSubmit() {
    const formData = new FormData(this);

    dispatch("submit", { priceId: formData.get("price_id") });
  }
</script>

<p class="plan-name">{plan.name}</p>

<div class="products">
  {#each plan.products as product}
    {@const price = product.price.currencies.find(
      (currency) => currency.locale === locale
    )}

    <form on:submit|preventDefault={handleSubmit}>
      <p>
        <strong>
          {product.name}
        </strong>
      </p>

      <p>
        <span class="price"
          >£{price.amount}<span class="billing-frequency">/per month</span
          ></span
        ><br />or £{price.amount * 10}/per year
      </p>

      <p>Includes:</p>

      <ul>
        {#each product.features as feature}
          <li>{feature}</li>
        {/each}
      </ul>

      <input type="hidden" name="price_id" value={product.price.id} />

      <button type="submit">Choose</button>
    </form>
  {/each}
</div>

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

  .products {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
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
