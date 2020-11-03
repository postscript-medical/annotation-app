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
      mutation CreateAnOrganization ($email: String! $netlifyId: ID! $stripeId: ID! $role: String!) {
        createOrganization(data: {
          email: $email
          level: "inactive"
          maxSpecialties: 1
          maxUsers: 1
          specialties:["oncology"]
          stripeId: $stripeId
          teams: {
            create: [{
              name: "Default team",
              members: {
                create: [{
                  email: $email
                  netlifyId: $netlifyId
                  role: $role
                  showTutorial: true
                }]
              }
            }]
          }
        }) {
          _id
          email
        }
      }
    `,
    variables: {
      email: user.email,
      netlifyId: user.id,
      stripeId: customer.id,
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
