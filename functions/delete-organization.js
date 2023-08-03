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
    console.log("::: [delete-organization] ERROR :::", event);

    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Invalid JSON body - ${error.message}` }),
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

    if (`${netlifyUser.status}`[0] === "4") {
      return {
        statusCode: netlifyUser.status,
        body: JSON.stringify({
          message: netlifyUser.statusText + " - are you in localhost?",
        }),
      };
    }

    /*
      No need to .catch() when deleting a Stripe user.
      If the .del() method fails, it will be caught
      by the encompassing try/catch
    */
    if (body.stripeID) {
      await stripe.customers.del(body.stripeID);
    }

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
          body: JSON.stringify({ message: "Organization and users deleted" }),
        };
      })
      .catch((error) => {
        console.log("::: [delete-organization] ERROR :::", error);

        return {
          statusCode: error.requestResult.statusCode,
          body: JSON.stringify({ message: error.message }),
        };
      });
  } catch (error) {
    console.log("::: [delete-organization] CATCH :::", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Webhook Error: ${error.message}` }),
    };
  }
};
