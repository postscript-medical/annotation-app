const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { faunaFetch } = require('./utils/fauna');

exports.handler = async (_, context) => {
  const { user } = context.clientContext;

  console.log('user', user);

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

  console.log('result', result);

  const { stripeId } = result.data.getOrganizationByEmail;

  console.log('stripe', stripeId);

  const link = await stripe.billingPortal.sessions.create({
    customer: stripeId,
    return_url: process.env.URL,
  });

  console.log('link', link);

  return {
    statusCode: 200,
    body: JSON.stringify(link.url),
  };
};
