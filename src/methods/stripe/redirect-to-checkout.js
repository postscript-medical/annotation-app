export default function (key, sessionId) {
  /*
  * Global Stripe object is imported via extrenal <script> tag
  */
  const stripe = Stripe(key);
  stripe.redirectToCheckout({
    // Make the id field from the Checkout Session creation API response
    // available to this file, so you can provide it as argument here
    // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
    sessionId: sessionId
  }).then(function (result) {
    // If `redirectToCheckout` fails due to a browser or network
    // error, display the localized error message to your customer
    // using `result.error.message`.
    console.log('~~~ End of Stripe Checkout ~~~')
    console.log('Checkout response:', response)
  });
}