const deleteNetlifyUser = require("./utils/delete-netlify-user");
const faunadb = require("faunadb");
const { Collection, Delete, Do, Get, Match, Select, Ref } = faunadb.query;

exports.handler = async (event, context) => {
  const { identity } = context.clientContext;
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

  try {
    const response = await deleteNetlifyUser(
      identity.url,
      identity.token,
      body.netlifyID
    );

    if (!response) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No user deleted" }),
      };
    }

    const data = await response.json();

    if (`${data.code}`[0] === "4") {
      return {
        statusCode: data.code,
        body: JSON.stringify({ message: data.msg }),
      };
    }

    const client = new faunadb.Client({
      secret: process.env.FAUNA_SERVER_KEY,
    });

    return client
      .query(
        Do(
          /**
           * Delete the user's AppState
           */
          Delete(
            Ref(
              Collection("UserAppState"),
              Select(
                ["ref", "id"],
                Get(
                  Match(
                    "userAppState_userRef_by_user",
                    Ref(Collection("User"), body.userID)
                  )
                )
              )
            )
          ),
          /**
           * Delete the user
           */
          Delete(Ref(Collection("User"), body.userID))
        )
      )
      .then(() => {
        return {
          statusCode: 204,
        };
      })
      .catch((error) => console.log("::: Delete Team member ERROR :::", error));
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Webhook Error: ${error.message}` }),
    };
  }
};
