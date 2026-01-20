const { createClient } = require("@supabase/supabase-js");
const { ERROR_CODES, createAndLogError } = require("./utils/error-handler");

exports.handler = async () => {
  try {
    // Validate Supabase environment variables
    if (
      !process.env.SUPABASE_DATABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error(
        "Missing SUPABASE_DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
      );
    }

    // Create Supabase client with SERVICE_ROLE_KEY
    const supabase = createClient(
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

    // Get all organizations
    const { data: organizations, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, email, stripe_id");

    if (orgError) {
      return createAndLogError(
        500,
        ERROR_CODES.FETCH_FAILED,
        "Failed to fetch organizations",
        orgError,
        { function: "get-organizations" }
      );
    }

    // For each organization, find the owner user
    // The owner is the user with role='owner' whose email matches the organization's email
    // and whose team belongs to this organization
    const result = await Promise.all(
      organizations.map(async (org) => {
        // Find owner user: email matches org.email, role is 'owner', and team belongs to org
        const { data: ownerUsers, error: userError } = await supabase
          .from("users")
          .select(
            `
            id,
            email,
            netlify_id,
            auth_id,
            teams!inner (
              id,
              organization_id
            )
          `
          )
          .eq("email", org.email || "")
          .eq("role", "owner")
          .eq("teams.organization_id", org.id)
          .limit(1);

        if (userError || !ownerUsers || ownerUsers.length === 0) {
          // If no owner found, return org with email as owner (fallback)
          return {
            id: org.id,
            owner: org.email || "",
            netlifyID: null,
            stripeID: org.stripe_id || "",
          };
        }

        const ownerUser = ownerUsers[0];

        // Use auth_id if available, otherwise fall back to netlify_id
        const authId = ownerUser.auth_id || ownerUser.netlify_id || null;

        return {
          id: org.id,
          owner: ownerUser.email,
          netlifyID: authId,
          stripeID: org.stripe_id || "",
        };
      })
    );

    // Format response to match original FaunaDB structure
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result,
      }),
    };
  } catch (error) {
    return createAndLogError(
      500,
      ERROR_CODES.SERVER_ERROR,
      "Internal server error",
      error,
      { function: "get-organizations" }
    );
  }
};
