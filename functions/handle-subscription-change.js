const faunadb = require("faunadb");
const { Get, Index, Let, Match, Select, Update, Var } = faunadb.query;
const { getEnvironmentKey } = require("./utils/get-environment-key");
const FAUNA_KEY = getEnvironmentKey("FAUNA_SERVER_KEY", process.env.CONTEXT);
const STRIPE_KEY = getEnvironmentKey("STRIPE_SECRET_KEY", process.env.CONTEXT);
const STRIPE_WEBHOOK_SECRET = getEnvironmentKey(
  "STRIPE_WEBHOOK_SECRET",
  process.env.CONTEXT
);
const stripe = require("stripe")(process.env[STRIPE_KEY]);

exports.handler = async ({ body, headers }) => {
  try {
    /**
     * Make sure this event was sent legitimately.
     */
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      headers["stripe-signature"],
      process.env[STRIPE_WEBHOOK_SECRET]
    );

    const subscription = stripeEvent.data.object;

    /**
     * Bail if this is not the desired update event
     * TODO: payment fail, subscription cancelled
     */
    if (
      stripeEvent.type !== "customer.subscription.updated" ||
      !subscription ||
      !subscription.customer
    ) {
      return {
        statusCode: 200,
        headers,
        body: "{ message: Not the desired event }",
      };
    }

    const client = new faunadb.Client({
      secret: process.env[FAUNA_KEY],
    });
    const productId = subscription.items.data[0].plan.product;

    /**
     * Update the organization subscription details
     */
    await client
      .query(
        Let(
          {
            subscriptionPlan: Get(
              Match(Index("subscriptionPlan_by_productId"), productId)
            ),
          },
          Update(
            Select(
              "ref",
              Get(
                Match(Index("organization_by_stripeId"), subscription.customer)
              )
            ),
            {
              data: {
                maxUsers: Select(["data", "maxUsers"], Var("subscriptionPlan")),
                specialties: Select(
                  ["data", "specialties"],
                  Var("subscriptionPlan")
                ),
                subscriptionLevel: Select(
                  ["data", "level"],
                  Var("subscriptionPlan")
                ),
              },
            }
          )
        )
      )
      .catch((error) => {
        console.log("::: Handle subscription change error :::", error);

        return {
          statusCode: 400,
          body: `{ error: Handle subscription change: ${error} }`,
        };
      });

    return {
      statusCode: 200,
      body: `{ success: true }`,
    };
  } catch (error) {
    console.log(`[ERROR] Stripe webhook failed with ${error}`);

    return {
      statusCode: 400,
      body: `{ error: Webhook Error: ${error.message}}`,
    };
  }
};
