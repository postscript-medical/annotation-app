const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { faunaFetch } = require('./utils/fauna');

exports.handler = async (_, context) => {
  const { user } = context.clientContext;

  const result = await faunaFetch({
    query: `
      query ($email: String!) {
        getOrganizationByEmail(email: $email) {
          stripeId
        }
      }
    `,
    variables: {
      email: user.email,
    },
  });

  const { stripeID } = result.data.getOrganizationByEmail;

  const link = await stripe.billingPortal.sessions.create({
    customer: stripeID,
    return_url: process.env.URL,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(link.url),
  };
};
