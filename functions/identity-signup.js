const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { faunaFetch } = require('./utils/fauna');

exports.handler = async event => {
  const { user } = JSON.parse(event.body);

  // create a new customer in Stripe
  const customer = await stripe.customers.create({ email: user.email });

  // collect card information
  // subscribe the new customer to the free plan
  // await stripe.subscriptions.create({
  //   customer: customer.id,
  //   items: [{ price: process.env.STRIPE_DEFAULT_PRICE_PLAN }],
  // });

  // store the Netlify and Stripe IDs in Fauna
  await faunaFetch({
    query: `
      mutation ($netlifyID: ID!, $stripeID: ID!, subscriptionActive: Boolean) {
        createUser(
          data: {
            netlifyID: $netlifyID,
            stripeID: $stripeID,
            subscriptionActive: $subscriptionActive
          }) {
          netlifyID
          stripeID
          subscriptionActive
        }
      }
    `,
    variables: {
      netlifyID: user.id,
      stripeID: customer.id,
      subscriptionActive: false,
    },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        roles: ['individual'], /* TODO: convert to a shared constant */
      },
    }),
  };
};
