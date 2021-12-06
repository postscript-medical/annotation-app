const faunadb = require("faunadb");
const { Update, Ref, Collection } = faunadb.query;
const { getEnvironmentKey } = require("./utils/get-environment-key");
const FAUNA_KEY = getEnvironmentKey("FAUNA_SERVER_KEY", process.env);

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
      Update(Ref(Collection("UserAppState"), body.id), {
        data: {
          selectedIllustrationTitle: body.selectedIllustrationTitle,
          selectedSpecialty: body.selectedSpecialty,
          selectedSubSpecialty: body.selectedSubSpecialty,
        },
      })
    )
    .then((response) => {
      return {
        statusCode: 200,
        body: JSON.stringify(response),
      };
    })
    .catch((error) => console.log("::: Update app state ERROR :::", error));
};
