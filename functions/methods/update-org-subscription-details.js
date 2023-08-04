const faunadb = require("faunadb");
const { Get, Index, Let, Match, Select, Update, Var } = faunadb.query;

module.exports = function updateOrgSubscriptionDetails(
  secret,
  productId,
  customerId
) {
  const client = new faunadb.Client({ secret });

  return client.query(
    Let(
      {
        subscriptionPlan: Get(
          Match(Index("subscriptionPlan_by_productId"), productId)
        ),
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
            maxSpecialties: Select(
              ["data", "maxSpecialties"],
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
  );
};
