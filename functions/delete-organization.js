const { createClient } = require("@supabase/supabase-js");
const { supabaseDeleteUser } = require("./methods/supabase-delete-user");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {
  ERROR_CODES,
  createAndLogError,
  createSimpleError,
} = require("./utils/error-handler");

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
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Authorization header required" }),
      };
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

    // Validate token and get user
    const {
      data: { user: authUser },
      error: tokenError,
    } = await supabase.auth.getUser(token);

    if (tokenError || !authUser) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid or expired token" }),
      };
    }

    // Get user from database to check role
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("auth_id", authUser.id)
      .single();

    if (userError || !currentUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    // Validate user has admin or DM role
    if (currentUser.role !== "admin" && currentUser.role !== "dm") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Unauthorized: Admin or DM role required",
        }),
      };
    }

    const { orgID, stripeID } = body;

    if (!orgID) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Organization ID is required" }),
      };
    }

    // Get organization info
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id, email")
      .eq("id", orgID)
      .single();

    if (orgError || !organization) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Organization not found" }),
      };
    }

    // Get all teams for this organization
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id")
      .eq("organization_id", orgID);

    if (teamsError) {
      return createAndLogError(
        500,
        ERROR_CODES.FETCH_FAILED,
        "Failed to fetch teams",
        teamsError,
        { organizationId: orgID }
      );
    }

    const teamIds = teams ? teams.map((team) => team.id) : [];

    // Get all users in teams belonging to this organization
    let allUserIds = [];
    let ownerAuthId = null;

    if (teamIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, auth_id, email, role")
        .in("team_id", teamIds);

      if (usersError) {
        return createAndLogError(
          500,
          ERROR_CODES.FETCH_FAILED,
          "Failed to fetch users",
          usersError,
          { organizationId: orgID, teamIds }
        );
      }

      allUserIds = users ? users.map((user) => user.id) : [];

      // Find owner user (role='owner' and email matches organization email)
      const ownerUser = users?.find(
        (user) => user.role === "owner" && user.email === organization.email
      );

      if (ownerUser && ownerUser.auth_id) {
        ownerAuthId = ownerUser.auth_id;
      }
    }

    // Delete Supabase Auth user (owner)
    if (ownerAuthId) {
      const deleteResult = await supabaseDeleteUser(
        process.env.SUPABASE_DATABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        ownerAuthId
      );

      if (deleteResult.message) {
        console.log(
          "Warning: Failed to delete Supabase Auth user:",
          deleteResult.message
        );
        // Continue with database deletion even if Auth deletion fails
      }
    }

    // Delete Stripe customer if stripeID provided
    if (stripeID) {
      try {
        await stripe.customers.del(stripeID);
      } catch (stripeError) {
        console.log(
          "Warning: Failed to delete Stripe customer:",
          stripeError.message
        );
        // Continue with database deletion even if Stripe deletion fails
      }
    }

    if (allUserIds.length > 0) {
      const { error: appStateError } = await supabase
        .from("user_app_states")
        .delete()
        .in("user_id", allUserIds);

      if (appStateError) {
        return createAndLogError(
          500,
          ERROR_CODES.DELETE_FAILED,
          "Failed to delete user app states",
          appStateError,
          { organizationId: orgID, userIds: allUserIds }
        );
      }
    }

    // Delete all users in teams belonging to this organization
    if (allUserIds.length > 0) {
      const { error: usersError } = await supabase
        .from("users")
        .delete()
        .in("id", allUserIds);

      if (usersError) {
        return createAndLogError(
          500,
          ERROR_CODES.DELETE_FAILED,
          "Failed to delete users",
          usersError,
          { organizationId: orgID, userIds: allUserIds }
        );
      }
    }

    // Delete all teams for this organization (use teamIds we already fetched)
    if (teamIds.length > 0) {
      const { error: teamsDeleteError } = await supabase
        .from("teams")
        .delete()
        .in("id", teamIds);

      if (teamsDeleteError) {
        return createAndLogError(
          500,
          ERROR_CODES.DELETE_FAILED,
          "Failed to delete teams",
          teamsDeleteError,
          { organizationId: orgID, teamIds }
        );
      }
    }

    // Finally, delete the organization
    const { error: orgDeleteError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", orgID);

    if (orgDeleteError) {
      return createAndLogError(
        500,
        ERROR_CODES.DELETE_FAILED,
        "Failed to delete organization",
        orgDeleteError,
        { organizationId: orgID }
      );
    }

    return {
      statusCode: 204,
      body: JSON.stringify({ message: "Organization and users deleted" }),
    };
  } catch (error) {
    return createAndLogError(
      500,
      ERROR_CODES.SERVER_ERROR,
      "Internal server error",
      error,
      { function: "delete-organization", orgID: body?.orgID }
    );
  }
};
