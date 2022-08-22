const deleteNetlifyUser = require("./methods/delete-netlify-user");
const faunadb = require("faunadb");
const {
  Collection,
  Delete,
  Do,
  Foreach,
  Get,
  Index,
  Lambda,
  Let,
  Match,
  Select,
  Ref,
  Var,
} = faunadb.query;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
    const netlifyUser = await deleteNetlifyUser(
      identity.url,
      identity.token,
      body.netlifyID
    );

    if (!netlifyUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No user deleted" }),
      };
    }

    if (`${netlifyUser.statusCode}`[0] === "4") {
      return {
        statusCode: netlifyUser.statusCode,
        body: netlifyUser.body,
      };
    }

    await stripe.customers.del(body.stripeID).catch((error) => {
      console.log("::: ERROR - Stripe - :::", error);
    });

    const client = new faunadb.Client({
      secret: process.env.FAUNA_KEY,
    });

    return client
      .query(
        Let(
          {
            organizationDoc: Get(Ref(Collection("Organization"), body.orgID)),
            userDoc: Get(
              Match(
                Index("findUserByEmail"),
                Select(["data", "email"], Var("organizationDoc"))
              )
            ),
          },
          Do(
            Delete(
              Ref(
                Collection("UserAppState"),
                Select(
                  ["ref", "id"],
                  Get(
                    Match(
                      "userAppState_userRef_by_user",
                      Ref(
                        Collection("User"),
                        Select(["ref", "id"], Var("userDoc"))
                      )
                    )
                  )
                )
              )
            ),
            Delete(
              Ref(Collection("User"), Select(["ref", "id"], Var("userDoc")))
            ),
            Foreach(
              Select(["data", "teams", "data"], Var("organizationDoc")),
              Lambda("ref", Delete(Var("ref")))
            ),
            Delete(
              Ref(
                Collection("Organization"),
                Select(["ref", "id"], Var("organizationDoc"))
              )
            )
          )
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
