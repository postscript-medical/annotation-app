const { createClient } = require("@supabase/supabase-js");
const { supabaseDeleteUser } = require("./methods/supabase-delete-user");
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

    // Get current user from database to check permissions
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id, role, team_id")
      .eq("auth_id", authUser.id)
      .single();

    if (currentUserError || !currentUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    const { userID } = body;

    if (!userID) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "User ID is required" }),
      };
    }

    // Get the user to be deleted
    const { data: userToDelete, error: userToDeleteError } = await supabase
      .from("users")
      .select("id, auth_id, team_id, role, email, user_app_states!inner(id)")
      .eq("id", userID)
      .single();

    if (userToDeleteError || !userToDelete) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User to delete not found" }),
      };
    }

    // Validate permissions: user must be owner, admin, or DM, and must be in the same team
    // OR the current user must be owner/admin/dm of the team
    const canDelete =
      (currentUser.role === "owner" ||
        currentUser.role === "admin" ||
        currentUser.role === "dm") &&
      (currentUser.team_id === userToDelete.team_id ||
        currentUser.role === "dm" ||
        currentUser.role === "admin");

    if (!canDelete) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Unauthorized: Insufficient permissions to delete team member",
        }),
      };
    }

    // Delete Supabase Auth user
    if (userToDelete.auth_id) {
      const deleteResult = await supabaseDeleteUser(
        process.env.SUPABASE_DATABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        userToDelete.auth_id
      );

      if (deleteResult.message) {
        console.log(
          "Warning: Failed to delete Supabase Auth user:",
          deleteResult.message
        );
        // Continue with database deletion even if Auth deletion fails
      }
    }

    // Delete user_app_state
    if (
      userToDelete.user_app_states &&
      userToDelete.user_app_states.length > 0
    ) {
      const appStateId = userToDelete.user_app_states[0].id;
      const { error: appStateError } = await supabase
        .from("user_app_states")
        .delete()
        .eq("id", appStateId);

      if (appStateError) {
        return createAndLogError(
          500,
          ERROR_CODES.DELETE_FAILED,
          "Failed to delete user app state",
          appStateError,
          { userId: userID, appStateId }
        );
      }
    }

    // Delete user
    const { error: userDeleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userID);

    if (userDeleteError) {
      return createAndLogError(
        500,
        ERROR_CODES.DELETE_FAILED,
        "Failed to delete user",
        userDeleteError,
        { userId: userID }
      );
    }

    return {
      statusCode: 204,
    };
  } catch (error) {
    return createAndLogError(
      500,
      ERROR_CODES.SERVER_ERROR,
      "Internal server error",
      error,
      { function: "delete-team-member" }
    );
  }
};
