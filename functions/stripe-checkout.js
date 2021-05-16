const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { priceId, email, fromConfirmationPage } = JSON.parse(event.body);

  const sessionParams = {
    customer_email: email,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
    // the actual Session ID is returned in the query parameter when your customer
    // is redirected to the success page.
    success_url: `${process.env.URL}/#/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.URL}/#/inactive-account`,
  };

  if (fromConfirmationPage) {
    sessionParams.cancel_url = `${process.env.URL}/#/confirm-signup?show-plans=true`;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    statusCode: 200,
    body: JSON.stringify({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    }),
  };
};
