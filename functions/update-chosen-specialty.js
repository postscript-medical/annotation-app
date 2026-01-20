const { SUPABASE_DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

const { createClient } = require("@supabase/supabase-js");
const {
  ERROR_CODES,
  createAndLogError,
  createSimpleError,
} = require("./utils/error-handler");

const supabase =
  SUPABASE_DATABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })
    : null;

exports.handler = async (event) => {
  if (!supabase) {
    return createSimpleError(
      500,
      ERROR_CODES.SERVER_CONFIGURATION_ERROR,
      "Server configuration error"
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
        { tokenPrefix: token.substring(0, 10) + "..." }
      );
    }

    // Get current user from database
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authUser.id)
      .single();

    if (userError || !currentUser) {
      return createAndLogError(
        404,
        ERROR_CODES.NOT_FOUND_USER,
        "User not found",
        userError,
        { authUserId: authUser.id }
      );
    }

    // Validate that userId is provided
    if (!body.userId) {
      return createSimpleError(
        400,
        ERROR_CODES.VALIDATION_MISSING_FIELD,
        "User ID is required"
      );
    }

    // Verify user can only update their own app state
    if (currentUser.id !== body.userId) {
      return createSimpleError(
        403,
        ERROR_CODES.AUTHORIZATION_OWNERSHIP_REQUIRED,
        "Unauthorized: You can only update your own app state"
      );
    }

    // Verify the app state belongs to this user
    const { data: appState, error: appStateError } = await supabase
      .from("user_app_states")
      .select("user_id")
      .eq("user_id", body.userId)
      .single();

    if (appStateError || !appState) {
      return createAndLogError(
        404,
        ERROR_CODES.NOT_FOUND_APP_STATE,
        "App state not found",
        appStateError,
        { userId: body.userId }
      );
    }
    // Look up specialty ID if specialty name is provided
    let specialtyId = null;

    if (body.specialtyName) {
      const { data: specialty, error: specialtyError } = await supabase
        .from("specialties")
        .select("id")
        .eq("name", body.specialtyName)
        .single();

      if (specialtyError) {
        return createAndLogError(
          404,
          ERROR_CODES.NOT_FOUND_SPECIALTY,
          "Specialty not found",
          specialtyError,
          { specialtyName: body.specialtyName }
        );
      }
      specialtyId = specialty.id;
    } else if (body.specialtyId) {
      // If specialtyId is provided directly, use it
      specialtyId = body.specialtyId;
    } else {
      return createSimpleError(
        400,
        ERROR_CODES.VALIDATION_MISSING_FIELD,
        "Either specialtyName or specialtyId must be provided"
      );
    }

    // Update the user's app state with the selected specialty
    const { error: updateError } = await supabase
      .from("user_app_states")
      .update({ selected_specialty_id: specialtyId })
      .eq("user_id", body.userId);

    if (updateError) {
      return createAndLogError(
        500,
        ERROR_CODES.UPDATE_FAILED,
        "Failed to update app state",
        updateError,
        { userId: body.userId, specialtyId }
      );
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        selected_specialty_id: specialtyId,
      }),
    };
  } catch (error) {
    return createAndLogError(
      500,
      ERROR_CODES.SERVER_ERROR,
      "Internal server error",
      error,
      { function: "update-chosen-specialty" }
    );
  }
};
