const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");
const { supabaseInviteUser } = require("./methods/supabase-invite-user");
const { supabaseDeleteUser } = require("./methods/supabase-delete-user");
const {
  ERROR_CODES,
  createAndLogError,
  createSimpleError,
} = require("./utils/error-handler");

exports.handler = async (event) => {
  let body;
  let invitedAuthUserId = null;
  let createdUserId = null;
  let createdAppStateId = null;

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
    const { email, firstName, lastName, organizationID, role, teamID } = body;

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
        "Authorization header required"
      );
    }

    const token = authHeader.replace("Bearer ", "");

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

    // Validate token with Supabase Auth
    const {
      data: { user: authUser },
      error: tokenError,
    } = await supabaseClient.auth.getUser(token);

    if (tokenError || !authUser) {
      return createAndLogError(
        401,
        ERROR_CODES.AUTH_INVALID_TOKEN,
        "Invalid or expired token",
        tokenError,
        { tokenPrefix: token.substring(0, 10) + "..." }
      );
    }

    // Get current user from database
    const { data: currentUser, error: currentUserError } = await supabaseClient
      .from("users")
      .select("id, role, team_id, teams!inner(organization_id)")
      .eq("auth_id", authUser.id)
      .single();

    if (currentUserError || !currentUser) {
      return createAndLogError(
        404,
        ERROR_CODES.NOT_FOUND_USER,
        "User not found",
        currentUserError,
        { authUserId: authUser.id }
      );
    }

    // Verify user has permission to invite (owner/admin/dm role)
    if (
      currentUser.role !== "owner" &&
      currentUser.role !== "admin" &&
      currentUser.role !== "dm"
    ) {
      return createSimpleError(
        403,
        ERROR_CODES.AUTHORIZATION_INSUFFICIENT_PERMISSIONS,
        "Unauthorized: Insufficient permissions to invite team members"
      );
    }

    // Validate organizationID and teamID exist and team belongs to organization
    const { data: teamData, error: teamError } = await supabaseClient
      .from("teams")
      .select("id, organization_id, name")
      .eq("id", teamID)
      .eq("organization_id", organizationID)
      .single();

    if (teamError || !teamData) {
      return createAndLogError(
        400,
        ERROR_CODES.NOT_FOUND_TEAM,
        "Invalid team or organization. Team does not belong to the specified organization.",
        teamError,
        { teamID, organizationID }
      );
    }

    // Verify user belongs to the organization they're inviting to
    if (currentUser.teams.organization_id !== organizationID) {
      return createSimpleError(
        403,
        ERROR_CODES.AUTHORIZATION_ORGANIZATION_MISMATCH,
        "Unauthorized: You can only invite members to your own organization"
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseClient
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return createSimpleError(
        400,
        ERROR_CODES.VALIDATION_INVALID_FORMAT,
        "User with this email already exists"
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
      return createAndLogError(
        400,
        ERROR_CODES.CREATE_FAILED,
        "Failed to invite user",
        new Error(inviteResult.message),
        { email, organizationID, teamID }
      );
    }

    if (!inviteResult.user || !inviteResult.user.id) {
      throw new Error("Failed to invite user - no user data returned");
    }

    invitedAuthUserId = inviteResult.user.id;

    // Create user record first (user_app_state requires user_id, which is NOT NULL)
    const userSourceId = randomUUID();
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .insert({
        original_source_id: userSourceId,
        email: email,
        first_name: firstName || null,
        last_name: lastName || null,
        role: role,
        auth_id: invitedAuthUserId, // Supabase Auth user ID
        team_id: teamID,
        show_tutorial: true,
      })
      .select()
      .single();

    if (userError) {
      // Cleanup: delete Supabase Auth user
      await supabaseDeleteUser(
        process.env.SUPABASE_DATABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        invitedAuthUserId
      );
      return createAndLogError(
        500,
        ERROR_CODES.CREATE_FAILED,
        "Failed to create user",
        userError,
        { email, invitedAuthUserId, organizationID, teamID }
      );
    }

    createdUserId = userData.id;

    // Create user_app_state with the user_id (NOT NULL constraint)
    const appStateSourceId = randomUUID();
    const { data: appStateData, error: appStateError } = await supabaseClient
      .from("user_app_states")
      .insert({
        original_source_id: appStateSourceId,
        user_id: userData.id, // Required NOT NULL field
        selected_specialty_id: null,
        selected_sub_specialty_id: null,
        selected_illustration_id: null,
      })
      .select()
      .single();

    if (appStateError) {
      // Cleanup: delete user and Supabase Auth user
      await supabaseClient.from("users").delete().eq("id", createdUserId);
      await supabaseDeleteUser(
        process.env.SUPABASE_DATABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        invitedAuthUserId
      );
      return createAndLogError(
        500,
        ERROR_CODES.CREATE_FAILED,
        "Failed to create user app state",
        appStateError,
        { userId: createdUserId, invitedAuthUserId, email }
      );
    }

    createdAppStateId = appStateData.id;

    return { statusCode: 204 };
  } catch (error) {
    // Cleanup on error
    if (invitedAuthUserId) {
      try {
        await supabaseDeleteUser(
          process.env.SUPABASE_DATABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          invitedAuthUserId
        );
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
    }

    if (createdUserId) {
      try {
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
        await supabaseClient.from("users").delete().eq("id", createdUserId);
      } catch (cleanupError) {
        console.error("Error deleting user:", cleanupError);
      }
    }

    if (createdAppStateId) {
      try {
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
        await supabaseClient
          .from("user_app_states")
          .delete()
          .eq("id", createdAppStateId);
      } catch (cleanupError) {
        console.error("Error deleting user_app_state:", cleanupError);
      }
    }

    return createAndLogError(
      500,
      ERROR_CODES.CREATE_FAILED,
      "Failed to add team member",
      error,
      {
        function: "invite-team-member",
        email: body?.email,
        organizationID: body?.organizationID,
        teamID: body?.teamID,
      }
    );
  }
};
