const faunadb = require("faunadb");
const {
  Collection,
  Get,
  Index,
  Lambda,
  Map,
  Match,
  Paginate,
  Ref,
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
    secret: process.env.FAUNA_SERVER_KEY,
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
        Lambda(["name", "ref"], Get(Var("ref")))
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
