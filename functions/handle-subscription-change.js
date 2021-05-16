const { PLAN_0, SUBSCRIPTIONS } = require("./constants");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { faunaFetch } = require("./utils/fauna");

exports.handler = async ({ body, headers }) => {
  try {
    // make sure this event was sent legitimately.
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const subscription = stripeEvent.data.object;

    console.log("stripeEvent >>>>", stripeEvent);

    // bail if this is not a the desired update event
    if (
      stripeEvent.type !== "customer.subscription.updated" ||
      !subscription ||
      !subscription.customer
    ) {
      return {
        statusCode: 200,
        headers,
        body: "Not the desired event",
      };
    }

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

    // TO FIX:
    // Frequently during the test phase, we receive null
    // as part of the result Response, which causes everything
    // that follows to createEventDispatcher.
    console.log("result >>>>>>", result);

    const organizationID = result.data.findOrganizationBystripeID._id;
    const productID = subscription.items.data[0].plan.product;
    const new_subscription = SUBSCRIPTIONS.find(
      ({ product }) => product === productID
    );

    const TEMP_SPECIALTIES = ["281450725888754183", "281450746883342853"];

    if (new_subscription.level === PLAN_0) {
      await faunaFetch({
        query: `
          mutation ($id: ID! $specialties: [ID] $maxUsers: Int $subscriptionLevel: String) {
            updateOrganization (id: $id, data: {
              maxUsers: $maxUsers
              specialties: { disconnect: $specialties }
              subscriptionLevel: $subscriptionLevel
            }) {
              name
              maxUsers
              subscriptionLevel
              specialties {
                data {
                  name
                }
              }
            }
          }
        `,
        variables: {
          id: `${organizationID}`,
          maxUsers: new_subscription.maxUsers,
          specialties: TEMP_SPECIALTIES,
          subscriptionLevel: new_subscription.level,
        },
      }).catch((err) => {
        console.log("handle fetch error", err.message);
      });
    } else {
      await faunaFetch({
        query: `
          mutation ($id: ID! $specialties: [ID] $maxUsers: Int $subscriptionLevel: String) {
            updateOrganization (id: $id, data: {
              maxUsers: $maxUsers
              specialties: { connect: $specialties }
              subscriptionLevel: $subscriptionLevel
            }) {
              name
              maxUsers
              subscriptionLevel
              specialties {
                data {
                  name
                }
              }
            }
          }
        `,
        variables: {
          id: `${organizationID}`,
          maxUsers: new_subscription.maxUsers,
          specialties: TEMP_SPECIALTIES,
          subscriptionLevel: new_subscription.level,
        },
      }).catch((err) => {
        console.log("handle fetch error", err.message);
      });
    }

    return {
      statusCode: 200,
      body: `{ received: true }`,
    };
  } catch (error) {
    console.log(`Stripe webhook failed with ${error}`);

    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  }
};
