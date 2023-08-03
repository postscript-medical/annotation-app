const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { email, priceId } = JSON.parse(event.body);

  const sessionParams = {
    cancel_url: `${process.env.URL}`,
    customer_email: email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        email,
      },
    },
    mode: "subscription",
    payment_method_types: ["card"],
    /**
     * {CHECKOUT_SESSION_ID} is a string literal; do not change it!
     * the actual Session ID is returned in the query parameter when your customer
     * is redirected to the success page.
     */
    success_url: `${process.env.URL}/#/success?session_id={CHECKOUT_SESSION_ID}`,
  };

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    statusCode: 200,
    body: JSON.stringify({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLIC_KEY,
    }),
  };
};
