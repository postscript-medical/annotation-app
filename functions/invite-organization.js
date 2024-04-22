const postmark = require("postmark");
const faunadb = require("faunadb");

const netlifyInviteUser = require("./methods/netlify-invite-user");
const createOrganization = require("./methods/create-organization");

const emailClient = new postmark.ServerClient(process.env.POSTMARK_TOKEN);

exports.handler = async (event, context) => {
  const { identity } = context.clientContext;
  let body;

  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.log("::: [invite-organization] ERROR :::", event);

    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Invalid JSON body - ${error.message}` }),
    };
  }

  try {
    const { email, orgName } = body;

    const response = await netlifyInviteUser(
      identity.url,
      identity.token,
      email
    );

    if (!response) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No user created" }),
      };
    }

    const data = await response.json();

    if (`${data.code}`[0] === "4") {
      console.log(`Error in data object :::`, data);
      return {
        statusCode: data.code,
        body: JSON.stringify({ message: data.msg }),
      };
    }

    const faunaClient = new faunadb.Client({
      secret: process.env.FAUNA_KEY,
    });

    const organization = {
      chosenSpecialty: "all",
      maxUsers: 50,
      name: orgName,
      subscriptionLevel: "organisation",
      specialties: null,
      stripeID: null,
    };
    const team = { name: "My team" };
    const user = {
      id: data.id,
      email: data.email,
      firstName: null,
      lastName: null,
    };
    const role = "owner";

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
      Subject: "[POSTSCRIPT] New Org invited",
      HtmlBody: `Heads up new Org under: ${email}`,
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
    console.log("::: [invite-organization] CATCH :::", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Webhook Error: ${error.message}` }),
    };
  }
};
