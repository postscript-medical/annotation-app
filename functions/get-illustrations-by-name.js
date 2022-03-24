const faunadb = require("faunadb");
const {
  ContainsStr,
  Filter,
  Get,
  Index,
  Lambda,
  Let,
  LowerCase,
  Map,
  Match,
  Paginate,
  Select,
  Var,
} = faunadb.query;

exports.handler = (event) => {
  let body;

  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.log("::: ERROR :::", event);

    return {
      statusCode: 400,
      body: `::: ERROR - Invalid JSON - ::: ${error.message}`,
    };
  }

  const client = new faunadb.Client({
    secret: process.env.FAUNA_KEY,
  });

  return client
    .query(
      Map(
        Filter(
          Paginate(Match(Index("all_illustrations_sorted_by_name")), {
            size: 10000,
          }),
          Lambda(
            ["name", "ref"],
            ContainsStr(
              LowerCase(Select(["data", "name"], Get(Var("ref")))),
              LowerCase(body.searchTerm)
            )
          )
        ),
        Lambda(
          ["name", "ref"],
          Let(
            {
              illustrationDoc: Get(Var("ref")),
            },
            {
              id: Select(["ref", "id"], Var("illustrationDoc")),
              name: Select(["data", "name"], Var("illustrationDoc")),
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
    .catch((error) =>
      console.log(":: Get Illustrations by name ERROR ::", error)
    );
};
