const { If, ContainsPath } = require("faunadb");
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
const { getEnvironmentKey } = require("./utils/get-environment-key");
const FAUNA_KEY = getEnvironmentKey("FAUNA_SERVER_KEY", process.env.CONTEXT);

exports.handler = () => {
  const client = new faunadb.Client({
    secret: process.env[FAUNA_KEY],
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
                },
                {
                  is_premium: If(
                    ContainsPath(
                      ["data", "is_premium"],
                      Var("subscriptionPlanDoc")
                    ),
                    Select(["data", "is_premium"], Var("subscriptionPlanDoc")),
                    false
                  ),
                  max_users: Select(
                    ["data", "max_users"],
                    Var("subscriptionPlanDoc")
                  ),
                  max_specialties: Select(
                    ["data", "max_specialties"],
                    Var("subscriptionPlanDoc")
                  ),
                  name: Select(["data", "name"], Var("subscriptionPlanDoc")),
                  price: Select(["data", "price"], Var("subscriptionPlanDoc")),
                  priceId_monthly: Select(
                    ["data", "priceId_monthly"],
                    Var("subscriptionPlanDoc")
                  ),
                  priceId_yearly: Select(
                    ["data", "priceId_yearly"],
                    Var("subscriptionPlanDoc")
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
