const faunadb = require("faunadb");
const {
  Collection,
  Get,
  Index,
  Lambda,
  Let,
  Map,
  Match,
  Paginate,
  Ref,
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

  let before;
  let after;

  if (body.before) {
    before = [
      body.before[0],
      Ref(Collection("Illustration"), body.before[1]["@ref"].id),
      Ref(Collection("Illustration"), body.before[2]["@ref"].id),
    ];
  }

  if (body.after) {
    after = [
      body.after[0],
      Ref(Collection("Illustration"), body.after[1]["@ref"].id),
      Ref(Collection("Illustration"), body.after[2]["@ref"].id),
    ];
  }

  return client
    .query(
      Map(
        Paginate(Match(Index("all_illustrations_sorted_by_name")), {
          after,
          before,
        }),
        Lambda(
          ["name", "ref"],
          Let(
            {
              illustrationDoc: Get(Var("ref")),
            },
            {
              alias: Select(["data", "alias"], Var("illustrationDoc")),
              id: Select(["ref", "id"], Var("illustrationDoc")),
              name: Select(["data", "name"], Var("illustrationDoc")),
              src: Select(["data", "src"], Var("illustrationDoc")),
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
    .catch((error) => console.log(":: Get Illustration ERROR ::", error));
};
