const faunadb = require("faunadb");
const { Collection, Get, Index, Lambda, Map, Match, Ref, Select, Update, Var } =
  faunadb.query;
const { getEnvironmentKey } = require("./utils/get-environment-key");
const FAUNA_KEY = getEnvironmentKey("FAUNA_SERVER_KEY", process.env.CONTEXT);
const STRIPE_KEY = getEnvironmentKey("STRIPE_SECRET_KEY", process.env.CONTEXT);
const stripe = require("stripe")(process.env[STRIPE_KEY]);

exports.handler = async (event) => {
  const { email, specialties, stripeId, updateDb } = JSON.parse(event.body);

  if (updateDb) {
    const specialtiesArray = Array.isArray(specialties)
      ? specialties
      : [specialties];

    const client = new faunadb.Client({
      secret: process.env[FAUNA_KEY],
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

    // Continue if no errors from DB
  }

  const { url } = await stripe.billingPortal.sessions.create({
    customer: stripeId,
    return_url: process.env.URL,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ url }),
  };
};
