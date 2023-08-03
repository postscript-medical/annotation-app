const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const updateOrgSubscriptionDetails = require("./methods/update-org-subscription-details");
const updateOrgStipeId = require("./methods/update-org-stripe-id");

const faunaKey = process.env.FAUNA_KEY;
const inactiveId = process.env.STRIPE_INACTIVE_PRODUCT;

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

    const productId = subscription.items.data[0].plan.product;

    console.log("::: Handle subscription change :::", subscription);

    switch (stripeEvent.type) {
      case "customer.subscription.created":
        console.log(">>>>>>>>>> Subscription created");
        await updateOrgStipeId(
          faunaKey,
          subscription.subscription_data.email,
          subscription.customer
        ).catch((error) => {
          console.log("::: Handle subscription updated error :::", error);

          return {
            statusCode: 400,
            body: `{ error: Handle subscription updated: ${error} }`,
          };
        });
        break;

      case "customer.subscription.updated":
        await updateOrgSubscriptionDetails(
          faunaKey,
          productId,
          subscription.customer
        ).catch((error) => {
          console.log("::: Handle subscription updated error :::", error);

          return {
            statusCode: 400,
            body: `{ error: Handle subscription updated: ${error} }`,
          };
        });
        break;

      case "customer.subscription.deleted":
        await updateOrgSubscriptionDetails(
          faunaKey,
          inactiveId,
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
