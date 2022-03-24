const faunadb = require("faunadb");
const { Collection, Get, Index, Lambda, Map, Match, Ref, Select, Update, Var } =
  faunadb.query;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { email, priceId, fromConfirmationPage, specialties } = JSON.parse(
    event.body
  );

  const sessionParams = {
    customer_email: email,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    /**
     * {CHECKOUT_SESSION_ID} is a string literal; do not change it!
     * the actual Session ID is returned in the query parameter when your customer
     * is redirected to the success page.
     */
    success_url: `${process.env.URL}/#/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.URL}`,
  };

  if (fromConfirmationPage) {
    const specialtiesArray = Array.isArray(specialties)
      ? specialties
      : [specialties];

    const client = new faunadb.Client({
      secret: process.env.FAUNA_KEY,
    });

    await client
      .query(
        Update(
          Select(
            ["data", "teams", "data", 0],
            Get(Match(Index("findOrganizationByEmail"), email))
          ),
          {
            data: {
              specialties: Map(
                specialtiesArray,
                Lambda("id", Ref(Collection("Specialty"), Var("id")))
              ),
            },
          }
        )
      )
      .catch((err) =>
        console.error(
          "Error: [%s] %s: %s",
          err.name,
          err.message,
          err.errors()[0].description
        )
      );
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    statusCode: 200,
    body: JSON.stringify({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLIC_KEY,
    }),
  };
};
