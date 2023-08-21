const faunadb = require("faunadb");
const {
  Paginate,
  Documents,
  Collection,
  ContainsPath,
  If,
  Index,
  Lambda,
  Let,
  Match,
  Get,
  Var,
  Map,
  Select,
} = require("faunadb");

exports.handler = () => {
  try {
    const client = new faunadb.Client({
      secret: process.env.FAUNA_KEY,
    });

    return client
      .query(
        Map(
          Paginate(Documents(Collection("Organization"))),
          Lambda(
            "ref",
            Let(
              {
                organization: Get(Var("ref")),
                owner: Get(
                  Match(
                    Index("findUserByEmail"),
                    Select(["data", "email"], Var("organization"))
                  )
                ),
              },
              {
                id: Select(["ref", "id"], Var("organization")),
                owner: Select(["data", "email"], Var("owner")),
                netlifyID: Select(["data", "netlifyID"], Var("owner")),
                stripeID: If(
                  ContainsPath(["data", "stripeID"], Var("organization")),
                  Select(["data", "stripeID"], Var("organization")),
                  ""
                ),
              }
            )
          )
        )
      )
      .then((response) => {
        return {
          statusCode: 200,
          body: JSON.stringify(response),
        };
      })
      .catch((error) => {
        console.log("::: Get Organizations ERROR :::", error);

        return {
          statusCode: 400,
          body: `Webhook Error: ${error}`,
        };
      });
  } catch (error) {
    console.log(":: ERROR :: [get-organizations] >>> ", error);

    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  }
};
