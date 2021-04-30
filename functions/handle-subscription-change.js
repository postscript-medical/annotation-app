const { PLAN_0, SUBSCRIPTIONS } = require("./constants");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { faunaFetch } = require("./utils/fauna");

exports.handler = async ({ body, headers }) => {
  console.log("request body", body);
  try {
    // make sure this event was sent legitimately.
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // bail if this is not a subscription update event
    if (stripeEvent.type !== "customer.subscription.updated") return;

    const subscription = stripeEvent.data.object;
    console.log("handle subscription change", subscription);
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
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  }
};
