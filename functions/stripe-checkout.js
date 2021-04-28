/*eslint no-undef: "error"*/
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const { priceId } = body;

  console.log("stripe-checkout:::", body, priceId);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: "price_1HbnUGApFf30oe2Kdm2ahhmg",
        quantity: 1,
      },
    ],
    // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
    // the actual Session ID is returned in the query parameter when your customer
    // is redirected to the success page.
    success_url: `${process.env.URL}/#/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.URL}/#/cancel`,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    }),
  };
};
