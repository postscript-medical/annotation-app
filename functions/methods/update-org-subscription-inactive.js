const faunadb = require("faunadb");
const { Get, Index, Match, Select, Update } = faunadb.query;

module.exports = function updateOrgSubscriptionDetails(secret, customerId) {
  const client = new faunadb.Client({ secret });

  return client.query(
    Update(
      Select("ref", Get(Match(Index("organization_by_stripeId"), customerId))),
      {
        data: {
          subscriptionLevel: "inactive",
        },
      }
    )
  );
};
