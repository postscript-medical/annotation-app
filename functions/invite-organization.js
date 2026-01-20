const postmark = require("postmark");
const { createClient } = require("@supabase/supabase-js");
const { supabaseInviteUser } = require("./methods/supabase-invite-user");
const supabaseCreateOrganization = require("./methods/supabase-create-organization");
const {
  ERROR_CODES,
  createAndLogError,
  createSimpleError,
} = require("./utils/error-handler");

// Lazy initialization of Postmark client to avoid errors when POSTMARK_TOKEN is not set
function getEmailClient() {
  if (!process.env.POSTMARK_TOKEN) {
    return null;
  }
  return new postmark.ServerClient(process.env.POSTMARK_TOKEN);
}

exports.handler = async (event) => {
  let body;

  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return createSimpleError(
      400,
      ERROR_CODES.VALIDATION_INVALID_JSON,
      "Invalid JSON body"
    );
  }

  try {
    const { email, orgName } = body;

    // Validate Supabase environment variables
    if (
      !process.env.SUPABASE_DATABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error(
        "Missing SUPABASE_DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
      );
    }

    // Invite user via Supabase Auth
    const inviteResult = await supabaseInviteUser(
      process.env.SUPABASE_DATABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      email
    );

    if (inviteResult.message) {
      // Error inviting user
      return {
        statusCode: 400,
        body: JSON.stringify({ message: inviteResult.message }),
      };
    }

    if (!inviteResult.user || !inviteResult.user.id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No user created" }),
      };
    }

    // Create Supabase client for database operations with SERVICE_ROLE_KEY
    const supabaseClient = createClient(
      process.env.SUPABASE_DATABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    const organization = {
      name: orgName,
      email: email,
      maxUsers: 50,
      subscriptionLevel: "organisation",
      stripeID: null,
    };
    const team = { name: "My team" };
    const user = {
      id: inviteResult.user.id, // Supabase Auth user ID
      email: inviteResult.user.email,
      firstName: null,
      lastName: null,
    };
    const role = "owner";

    const newOrg = await supabaseCreateOrganization({
      supabaseClient,
      organization,
      team,
      role,
      user,
    });

    if (newOrg.statusCode && `${newOrg.statusCode}`[0] === "4") {
      return newOrg;
    }

    // Send email notification if Postmark is configured
    const emailClient = getEmailClient();
    if (emailClient) {
      try {
        await emailClient.sendEmail({
          From: "accounts@postscriptmedical.com",
          To: "accounts@postscriptmedical.com",
          Subject: "[POSTSCRIPT] New Org invited",
          HtmlBody: `Heads up new Org under: ${email}`,
          MessageStream: "supabase-auth",
        });
      } catch (emailError) {
        // Continue even if email fails - non-fatal error
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        app_metadata: {
          roles: [role],
        },
      }),
    };
  } catch (error) {
    return createAndLogError(
      500,
      ERROR_CODES.SERVER_ERROR,
      "Internal server error",
      error,
      { function: "invite-organization", email: body?.email }
    );
  }
};
