const { createClient } = require("@supabase/supabase-js");
const {
  ERROR_CODES,
  createAndLogError,
  createSimpleError,
} = require("./utils/error-handler");

exports.handler = async (event) => {
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

    // Extract token from Authorization header
    const authHeader =
      event.headers?.authorization || event.headers?.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return createSimpleError(
        401,
        ERROR_CODES.AUTH_REQUIRED,
        "Authorization header required",
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    const token = authHeader.replace("Bearer ", "");

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

    // Validate token with Supabase Auth
    const {
      data: { user: authUser },
      error: tokenError,
    } = await supabase.auth.getUser(token);

    if (tokenError || !authUser) {
      return createAndLogError(
        401,
        ERROR_CODES.AUTH_INVALID_TOKEN,
        "Invalid or expired token",
        tokenError,
        { tokenPrefix: token.substring(0, 10) + "..." },
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    // Get user data with team and organization info
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        role,
        team_id,
        teams!inner (
          id,
          name,
          organization_id,
          organizations!inner (
            id,
            name,
            max_users,
            subscription_level
          )
        )
      `
      )
      .eq("auth_id", authUser.id)
      .single();

    if (userError || !userData) {
      return createAndLogError(
        404,
        ERROR_CODES.NOT_FOUND_USER,
        "User not found",
        userError,
        { authUserId: authUser.id },
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    const organizationId = userData.teams.organization_id;
    const organization = userData.teams.organizations;

    // Get all members for this organization (users in teams that belong to this organization)
    const { data: allMembers, error: membersError } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        role,
        netlify_id,
        auth_id,
        teams!inner (
          organization_id
        )
      `
      )
      .eq("teams.organization_id", organizationId)
      .order("first_name", { ascending: true, nullsFirst: false });

    if (membersError) {
      return createAndLogError(
        500,
        ERROR_CODES.FETCH_FAILED,
        "Failed to fetch team members",
        membersError,
        { organizationId, userId: userData.id },
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    // Transform members to match expected format
    const transformedMembers = (allMembers || []).map((member) => ({
      id: member.id,
      email: member.email,
      firstName: member.first_name || "",
      lastName: member.last_name || "",
      netlifyID: member.auth_id || member.netlify_id || null,
      role: member.role,
    }));

    // Format response to match original FaunaDB structure
    const response = {
      id: userData.id,
      role: userData.role,
      organization: {
        id: organization.id,
        name: organization.name,
        maxUsers: organization.max_users,
        subscriptionLevel: organization.subscription_level,
      },
      team: {
        id: userData.teams.id,
        name: userData.teams.name,
      },
      allMembers: {
        data: transformedMembers,
      },
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    return createAndLogError(
      500,
      ERROR_CODES.SERVER_ERROR,
      "Internal server error",
      error,
      { function: "get-management-data" },
      { "Access-Control-Allow-Origin": "*" }
    );
  }
};
