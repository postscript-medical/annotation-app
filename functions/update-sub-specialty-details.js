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

  let illustrationList = body.illustrations.map(({ id }) =>
    Ref(Collection("Illustration"), id)
  );

  return client
    .query(
      Update(Ref(Collection("SubSpecialty"), body.id), {
        data: {
          name: body.name,
          illustrations: illustrationList,
        },
      })
    )
    .then((response) => {
      return {
        statusCode: 200,
        body: JSON.stringify(response),
      };
    })
    .catch((error) => console.log("::: Update SubSpecialty ERROR :::", error));
};
