const faunadb = require("faunadb");
const { Get, Index, Match, Select, Update } = faunadb.query;

module.exports = function updateOrgStipeId(secret, email, customerId) {
  const client = new faunadb.Client({ secret });

  return client.query(
    Update(Select("ref", Get(Match(Index("findOrganizationByEmail"), email))), {
      data: {
        stripeID: customerId,
      },
    })
  );
};
