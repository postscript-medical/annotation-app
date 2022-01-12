const faunadb = require("faunadb");
const { Collection, Ref, Update } = faunadb.query;
const { getEnvironmentKey } = require("./utils/get-environment-key");
const FAUNA_KEY = getEnvironmentKey("FAUNA_SERVER_KEY", process.env.CONTEXT);

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
    secret: process.env[FAUNA_KEY],
  });

  return client
    .query(
      Update(Ref(Collection("Illustration"), body.id), {
        data: {
          name: body.name,
          alias: body.alias,
          src: body.src,
        },
      })
    )
    .then((response) => {
      return {
        statusCode: 200,
        body: JSON.stringify(response),
      };
    })
    .catch((error) => console.log("::: Update Illustration ERROR :::", error));
};
