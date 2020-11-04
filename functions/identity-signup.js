const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { faunaFetch } = require('./utils/fauna');

// TODO: Remove unused environment keys from Netlify

exports.handler = async event => {
  const { user } = JSON.parse(event.body);
  const role = 'owner';

  // create a new customer in Stripe
  const customer = await stripe.customers.create({ email: user.email });

  // subscribe the new customer to the free plan
  await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: process.env.STRIPE_DEFAULT_PRICE_PLAN }],
  });

  // Create a brand new organization in Fauna
  await faunaFetch({
    query: `
      mutation ($email: String! $netlifyID: ID! $stripeID: ID! $role: String!) {
        createOrganization(data: {
          maxSpecialties: 1
          maxUsers: 1
          name: "My organization"
          specialties:{ connect: "281280811957748229" }
          stripeID: $stripeID
          subscriptionLevel: "inactive"
          teams: {
            create: [{
              name: "My team",
              members: {
                create: [{
                  email: $email
                  netlifyID: $netlifyID
                  role: $role
                  showTutorial: true
                }]
              }
            }]
          }
        }) {
          _id
          name
        }
      }
    `,
    variables: {
      email: user.email,
      netlifyID: user.id,
      stripeID: customer.id,
      role
    },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        roles: [role],
      },
    }),
  };
};
