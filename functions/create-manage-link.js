const { getEnvironmentKey } = require("./utils/get-environment-key");
const STRIPE_KEY = getEnvironmentKey("STRIPE_SECRET_KEY", process.env.CONTEXT);
const stripe = require("stripe")(process.env[STRIPE_KEY]);

exports.handler = async (event) => {
  const body = JSON.parse(event.body);

  const stripeID = body.stripeID;
  const link = await stripe.billingPortal.sessions.create({
    customer: stripeID,
    return_url: process.env.URL,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(link.url),
  };
};
