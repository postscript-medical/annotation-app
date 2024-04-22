const postmark = require("postmark");
const faunadb = require("faunadb");
const { Collection, Exists, Get, If, Index, Match, Ref, Select, Update } =
  faunadb.query;
const createOrganization = require("./methods/create-organization");
const emailClient = new postmark.ServerClient(process.env.POSTMARK_TOKEN);

exports.handler = async (event) => {
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
    const { user, organization = {}, team = {} } = body;
    const { email = null } = user;
    const role = "owner";
    const faunaClient = new faunadb.Client({
      secret: process.env.FAUNA_KEY,
    });

    const existingUser = await faunaClient.query(
      If(
        Exists(Match(Index("findUserByEmail"), email)),
        Get(Match(Index("findUserByEmail"), email)),
        false
      )
    );

    /**
     * If the use already exists all we need to do is update
     * their invitationStatus to "Confirmed"
     */
    if (existingUser) {
      await faunaClient.query(
        Update(
          Ref(
            Collection("User"),
            Select(["ref", "id"], Get(Match(Index("findUserByEmail"), email)))
          ),
          {
            data: {
              invitationStatus: "Confirmed",
            },
          }
        )
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          app_metadata: {
            roles: ["team-member"],
          },
        }),
      };
    }

    const newOrg = await createOrganization({
      faunaClient,
      organization,
      team,
      role,
      user,
    });

    if (newOrg.statusCode && newOrg.statusCode === 400) {
      return newOrg;
    }

    await emailClient.sendEmail({
      From: "accounts@postscriptmedical.com",
      To: "accounts@postscriptmedical.com",
      Subject: "[POSTSCRIPT] New user signup",
      HtmlBody: `Heads up new user: ${email}`,
      MessageStream: "netlify-identity",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        app_metadata: {
          roles: [role],
        },
      }),
    };
  } catch (error) {
    console.log("::: IDENTITY SIGNUP CATCH :::", error);

    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Identity signup: ${error.message}` }),
    };
  }
};
