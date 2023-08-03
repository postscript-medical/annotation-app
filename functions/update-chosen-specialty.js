const faunadb = require("faunadb");
const { Update, Ref, Collection } = faunadb.query;

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
      Update(Ref(Collection("Organization"), body.id), {
        data: {
          chosenSpecialty: body.specialtyId,
          specialties: {
            data: [Ref(Collection("Specialty"), body.specialtyId)],
          },
        },
      })
    )
    .then((response) => {
      return {
        statusCode: 200,
        body: JSON.stringify(response),
      };
    })
    .catch((error) =>
      console.log("::: Update chosen specialty ERROR :::", error)
    );
};
