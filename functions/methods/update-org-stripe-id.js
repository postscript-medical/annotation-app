const faunadb = require("faunadb");
const { Equals, Get, If, Index, Let, Match, Select, Update, Var } =
  faunadb.query;

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
        product: Get(Match(Index("product_by_id"), productId)),
        subscriptionPlan: Get(Select(["data", "plan"], Var("product"))),
      },
      Update(
        Select("ref", Get(Match(Index("findOrganizationByEmail"), email))),
        {
          data: {
            chosenSpecialty: If(
              Equals(Select(["data", "type"], Var("product")), "single"),
              "",
              "all"
            ),
            productId,
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
