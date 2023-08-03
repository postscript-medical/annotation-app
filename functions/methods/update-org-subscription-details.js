const faunadb = require("faunadb");
const { Get, Index, Let, Match, Select, Update, Var } = faunadb.query;

module.exports = function updateOrgSubscriptionDetails(
  secret,
  customerId,
  productId
) {
  const client = new faunadb.Client({ secret });

  return client.query(
    Let(
      {
        product: Get(Match(Index("product_by_id"), productId)),
        subscriptionPlan: Get(Select(["data", "plan"], Var("product"))),
      },
      Update(
        Select(
          "ref",
          Get(Match(Index("organization_by_stripeId"), customerId))
        ),
        {
          data: {
            maxUsers: Select(["data", "maxUsers"], Var("subscriptionPlan")),
            maxTeams: Select(["data", "maxTeams"], Var("subscriptionPlan")),
            subscriptionLevel: Select(
              ["data", "level"],
              Var("subscriptionPlan")
            ),
          },
        }
      )
    )
  );
};
