const { SUBSCRIPTIONS } = require('./constants');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { faunaFetch } = require('./utils/fauna');
const faunadb = require('faunadb');
const q = faunadb.query;
const client = new faunadb.Client({ secret: process.env.FAUNA_SERVER_KEY })

exports.handler = async ({ body, headers }) => {
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
    // const result = await faunaFetch({
    //   query: `
    //       query ($id: ID!) {
    //         findOrganizationBystripeID (stripeID: $id) {
    //           _id
    //         }
    //       }
    //     `,
    //   variables: {
    //     id: subscription.customer,
    //   },
    // });
    // const organizationID = result.data.findOrganizationBystripeID._id;
    const productID = subscription.items.data[0].plan.product;
    const new_subscription = SUBSCRIPTIONS.find(({ product }) => product === productID);

    // find the matching specialties and add them to the 'Organization' collection
    // Gastro specialty ID: 281450746883342853
    // All specialty ID: 281450725888754183

    // if new_subscription !inactive
    console.log('local subscription change', new_subscription);

    const result = await faunaFetch({
      query: `
        mutation ($id: ID! $specialty: ID $maxUsers: Int! $subscriptionLevel: String) {
          updateOrganization (id: $id, data: {
            maxUsers: $maxUsers
            specialties: { connect: $specialty }
            subscriptionLevel: $subscriptionLevel
          })
        }
      `,
      variables: {
        id: subscription.customer,
        maxUsers: new_subscription.maxUsers,
        specialty: 281450725888754183,
        subscriptionLevel: new_subscription.level,
      }
    })

    // try the below as GraphQL

    // update the subscription record in FaunaDB
    // await client.query(
    //   q.Update(
    //     q.Ref(
    //       q.Collection('Organization'),
    //         organizationID),
    //         { 
    //           data: {
    //             subscriptionLevel: new_subscription.level,
    //             maxUsers: new_subscription.maxUsers,
    //             specialties: q.Ref(Collection('Specialty'), '281450725888754183'),
    //           }
    //         },
    //   )
    // );

    return {
      statusCode: 200,
      body: `{ received: true }`,
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  }
};
