const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { faunaFetch } = require('./utils/fauna');
const faunadb = require('faunadb');
const { SUBSCRIPTIONS } = require('./constants');
const q = faunadb.query;
const client = new faunadb.Client({ secret: process.env.FAUNA_SERVER_KEY })

exports.handler = async ({ body, headers }, context) => {
  try {
    // make sure this event was sent legitimately.
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    
    // bail if this is not a subscription update event
    if (stripeEvent.type !== 'customer.subscription.updated') return;
    
    const subscription = stripeEvent.data.object;
    const result = await faunaFetch({
      query: `
          query ($id: ID!) {
            findOrganizationBystripeID (stripeID: $id) {
              _id
            }
          }
        `,
      variables: {
        id: subscription.customer,
      },
    });
    const organizationID = result.data.findOrganizationBystripeID._id;
    const productID = subscription.items.data[0].plan.product;
    const newSubscription = SUBSCRIPTIONS.find(({ product }) => product === productID);

    // update the subscription record in FaunaDB
    await client.query(
      q.Update(
        q.Ref(
          q.Collection('Organization'),
            organizationID),
            { data: { subscriptionLevel: newSubscription.level } },
      )
    );

    // send a call to the Netlify Identity admin API to update the user role
    // const { identity } = context.clientContext;
    // await fetch(`${identity.url}/admin/users/${netlifyID}`, {
    //   method: 'PUT',
    //   headers: {
    //     // note that this is a special admin token for the Identity API
    //     Authorization: `Bearer ${identity.token}`,
    //   },
    //   body: JSON.stringify({
    //     app_metadata: {
    //       roles: [newSubscription.role],
    //     },
    //   }),
    // });

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  }
};
