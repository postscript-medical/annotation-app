<script>
  import { onMount } from 'svelte';
  import { session, isLoading } from '../stores.js';
  import ErrorMessage from './ErrorMessage.svelte';

  let name;
  let email;
  let password;
  let errorMessage;
  /*
  * This Stripe is an external link in the index.html page
  * it does not get included in the bundler as a requirement
  * to be PCI compliant.
  * The key used here is the public key. NEVER the secret key.
  */
  // const stripe = Stripe('pk_test_51HRFNnApFf30oe2K3dr1r6nLyYkJfisTDUzVAQ8uCh3SGIcHwY49wndXzVLpnuu5B0WX4QFW9lmFaQYUhcsKW09900IiYkkBpQ');
  // const stripeElements = stripe.elements();

  // Set up Stripe.js and Elements to use in checkout form
  const style = {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4"
      }
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a"
    }
  };

  // const cardElement = stripeElements.create("card", { style: style });
  // cardElement.on('change', toggleCardErrorMessage);

  // function toggleCardErrorMessage (e) {
  //   errorMessage = e.error ? e.error.message : '';
  // };
 
  function submit (e) {
    const form = e.target;

    if (!$session) {
      console.error('No $session object!');
      return;
    }

    $isLoading = true;

    $session
      .signup(email.value, password.value)
      .then(response => {
        console.log('created user', response);
        $isLoading = false;
        }
      )
      .catch(error => {
        console.error('Error', error);
      });
  };

  // function createPaymentMethod({ card, isPaymentRetry, invoiceId }) {
  //   // Set up payment method for recurring usage
  //   let billingName = document.querySelector('#name').value;

  //   stripe
  //     .createPaymentMethod({
  //       type: 'card',
  //       card: card,
  //       billing_details: {
  //         name: name.value,
  //       },
  //     })
  //     .then((result) => {
  //       if (result.error) {
  //         displayError(result);
  //       } else {
  //         if (isPaymentRetry) {
  //           // Update the payment method and retry invoice payment
  //           retryInvoiceWithNewPaymentMethod({
  //             customerId: customerId,
  //             paymentMethodId: result.paymentMethod.id,
  //             invoiceId: invoiceId,
  //             priceId: priceId,
  //           });
  //         } else {
  //           // Create the subscription
  //           createSubscription({
  //             customerId: customerId,
  //             paymentMethodId: result.paymentMethod.id,
  //             priceId: priceId,
  //           });
  //         }
  //       }
  //     });
  // }

  // onMount(() => {
  //   cardElement.mount("#card-element");
  // });
</script>

<article>
  <h3>
    Sign up
  </h3>
  <form
    name="signup"
    on:submit|preventDefault={ submit }
  >
    <!-- <label>
      Name
      <input
        bind:this={ name }
        name="name"
        type="text"
        required
      />
    </label> -->
    <label>
      Email
      <input
        bind:this={ email }
        name="email"
        type="email"
        required
      />
    </label>
    <label>
      Password
      <input
        bind:this={ password }
        name="password"
        type="password"
        required
      />
    </label>
    <div
      id="card-element"
      class="MyCardElement"
    >
      <!-- stripeElements will create input elements here -->
    </div>
    { #if errorMessage }
      <ErrorMessage>
        { errorMessage }
      </ErrorMessage>
    { /if }
    <button
      type="submit"
    >
      Submit
    </button>
  </form>
</article>