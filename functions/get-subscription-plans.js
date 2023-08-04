const faunadb = require("faunadb");
const {
  Documents,
  Paginate,
  Collection,
  Get,
  Index,
  Lambda,
  Let,
  Map,
  Match,
  Select,
  Var,
} = faunadb.query;

exports.handler = () => {
  const client = new faunadb.Client({
    secret: process.env.FAUNA_KEY,
  });

  return client
    .query(
      Let(
        {
          subscriptionPlans: Paginate(
            Documents(Collection("SubscriptionPlans"))
          ),
          specialties: Paginate(Match(Index("all_specialties"))),
        },
        {
          subscriptionPlans: Map(
            Var("subscriptionPlans"),
            Lambda(
              "ref",
              Let(
                {
                  subscriptionPlanDoc: Get(Var("ref")),
                  productsDoc: Select(
                    ["data", "products"],
                    Var("subscriptionPlanDoc")
                  ),
                },
                {
                  maxTeams: Select(
                    ["data", "maxTeams"],
                    Var("subscriptionPlanDoc")
                  ),
                  name: Select(["data", "name"], Var("subscriptionPlanDoc")),
                  products: Map(
                    Var("productsDoc"),
                    Lambda(
                      "productRef",
                      Let(
                        {
                          productDoc: Get(Var("productRef")),
                        },
                        {
                          name: Select(["data", "name"], Var("productDoc")),
                          id: Select(["data", "id"], Var("productDoc")),
                          price: Select(["data", "price"], Var("productDoc")),
                          features: Select(
                            ["data", "features"],
                            Var("productDoc")
                          ),
                        }
                      )
                    )
                  ),
                }
              )
            )
          ),
          specialties: Map(
            Var("specialties"),
            Lambda(
              "ref",
              Let(
                {
                  specialtyDoc: Get(Var("ref")),
                },
                {
                  id: Select(["ref", "id"], Var("specialtyDoc")),
                  name: Select(["data", "name"], Var("specialtyDoc")),
                }
              )
            )
          ),
        }
      )
    )
    .then((response) => {
      return {
        statusCode: 200,
        body: JSON.stringify(response),
      };
    })
    .catch((error) => {
      console.log("Error:", error);
      console.error(
        "Error: [%s] %s: %s",
        error.name,
        error.message,
        error.errors()[0].description
      );
    });
};
