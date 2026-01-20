const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const updateOrgSubscriptionCreated = require("./methods/update-org-subscription-created");
const updateOrgSubscriptionInactive = require("./methods/update-org-subscription-inactive");
const updateOrgSubscriptionDetails = require("./methods/update-org-subscription-details");

const faunaKey = process.env.FAUNA_KEY;

exports.handler = async ({ body, headers }) => {
  try {
    /**
     * Make sure this event was sent legitimately.
     */
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const subscription = stripeEvent.data.object;

    if (!subscription || !subscription.customer) {
      return {
        statusCode: 406,
        headers,
        body: "{ message: No valid subscription or customer }",
      };
    }

    const productId = subscription.plan.product;

    switch (stripeEvent.type) {
      case "customer.subscription.created":
        await updateOrgSubscriptionCreated(
          faunaKey,
          subscription.customer,
          productId,
          subscription.metadata.email
        ).catch((error) => {
          return {
            statusCode: 400,
            body: `{ error: Handle subscription created: ${error} }`,
          };
        });
        break;

      case "customer.subscription.updated":
        console.log(">>>>>>>>>> Subscription changed");
        await updateOrgSubscriptionDetails(
          faunaKey,
          subscription.customer,
          productId
        ).catch((error) => {
          console.log("::: Handle subscription updated error :::", error);

          return {
            statusCode: 400,
            body: `{ error: Handle subscription updated: ${error} }`,
          };
        });
        break;

      case "customer.subscription.deleted":
        console.log(">>>>>>>>>> Subscription deleted");
        await updateOrgSubscriptionInactive(
          faunaKey,
          subscription.customer
        ).catch((error) => {
          console.log("::: Handle subscription delete error :::", error);

          return {
            statusCode: 400,
            body: `{ error: Handle subscription delete: ${error} }`,
          };
        });
        break;

      default:
        return {
          statusCode: 406,
          headers,
          body: "{ message: Not the desired event }",
        };
    }

    return {
      statusCode: 200,
      body: "{ success: true }",
    };
  } catch (error) {
    console.log(
      `[ERROR] Stripe webhook subscription change failed with ${error}`
    );

    return {
      statusCode: 400,
      body: `{ error: Webhook subscription change Error: ${error.message}}`,
    };
  }
};
