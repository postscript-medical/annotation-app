const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { faunaFetch } = require('./utils/fauna');

exports.handler = async event => {
  const { user } = JSON.parse(event.body);

  // create a new customer in Stripe
  const customer = await stripe.customers.create({ email: user.email });

  // const create a new checkout session in Stripe
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    billing_address_collection: 'auto',
    success_url: `${process.env.URL}/#subscription_success`,
    cancel_url: process.env.URL,
    line_items: [
      {
        price: 'price_1HSOhAApFf30oe2KqzMBRqyn',
        quantity: 1,
      }
    ],
    mode: 'subscription'
  })

  // store the Netlify and Stripe IDs in Fauna
  await faunaFetch({
    query: `
      mutation ($netlifyID: ID!, $stripeID: ID!, $subscriptionActive: Boolean) {
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

  console.log('Stripe session', session.id);

  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        sessionId: session.id,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      },
    }),
  };
};
