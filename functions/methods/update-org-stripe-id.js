const faunadb = require("faunadb");
const { Get, Index, Let, Match, Select, Update, Var } = faunadb.query;

module.exports = function updateOrgStipeId(
  secret,
  customerId,
  productId,
  email
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
        Select("ref", Get(Match(Index("findOrganizationByEmail"), email))),
        {
          data: {
            stripeID: customerId,
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
