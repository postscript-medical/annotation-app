const fetch = require("node-fetch");
const deleteNetlifyUser = require("./utils/delete-netlify-user");
const faunadb = require("faunadb");
const { Collection, Create, Do, Get, Match, Ref, Select, Update } =
  faunadb.query;

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
    const {
      email,
      firstName,
      lastName,
      organizationID,
      password,
      role,
      teamID,
    } = body;

    const response = await fetch(`${identity.url}/admin/users`, {
      method: "POST",
      headers: { Authorization: `Bearer ${identity.token}` },
      body: JSON.stringify({
        email,
        password,
        confirm: true,
      }),
    }).catch((error) => {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: `Error creating user: ${error}` }),
      };
    });

    if (!response) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No user created" }),
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
    const newUserRef = "new-user";

    /**
     * TODO: If FQL fails, delete the Netlify user
     */
    return client
      .query(
        Do(
          /**
           * Create a new UserAppState with
           * a reference to a temporary user
           */
          Create(Collection("UserAppState"), {
            data: {
              selectedIllustrationTitle: "Graph",
              selectedSpecialty: "Gastroenterology",
              selectedSubSpecialty: "Hepatology",
              userRef: newUserRef,
            },
          }),
          /**
           * Create a new user and attach the
           * previously created UserAppState to it
           */
          Create(Collection("User"), {
            data: {
              appState: Ref(
                Collection("UserAppState"),
                Select(
                  ["ref", "id"],
                  Get(Match("userAppState_userRef_by_user", newUserRef))
                )
              ),
              email,
              firstName,
              lastName,
              netlifyID: data.id,
              organization: organizationID,
              role,
              showTutorial: true,
              team: Ref(Collection("Team"), teamID),
            },
          }),
          /**
           * Update UserAppState with the real user's reference
           */
          Update(
            Ref(
              Collection("UserAppState"),
              Select(
                ["ref", "id"],
                Get(Match("userAppState_userRef_by_user", newUserRef))
              )
            ),
            {
              data: {
                userRef: Ref(
                  Collection("User"),
                  Select(["ref", "id"], Get(Match("findUserByEmail", email)))
                ),
              },
            }
          )
        )
      )
      .then(() => {
        return {
          statusCode: 204,
        };
      })
      .catch((error) => {
        console.log("::: Create Team member ERROR :::", error);

        return deleteNetlifyUser(identity.url, identity.token, data.id)
          .then((response) => {
            console.log("User deleted", response);
            return {
              statusCode: 400,
              body: JSON.stringify({
                message: "User not created. Please contact support",
              }),
            };
          })
          .catch((error) => error);
      });
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Webhook Error: ${error.message}` }),
    };
  }
};
