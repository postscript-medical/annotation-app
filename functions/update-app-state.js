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

    // Validate that app state ID is provided
    if (!body.id) {
      return createSimpleError(
        400,
        ERROR_CODES.VALIDATION_MISSING_FIELD,
        "App state ID is required"
      );
    }

    // Verify the app state belongs to the current user
    const { data: appState, error: appStateError } = await supabase
      .from("user_app_states")
      .select("user_id")
      .eq("id", body.id)
      .single();

    if (appStateError || !appState) {
      return createAndLogError(
        404,
        ERROR_CODES.NOT_FOUND_APP_STATE,
        "App state not found",
        appStateError,
        { appStateId: body.id }
      );
    }

    if (appState.user_id !== currentUser.id) {
      return createSimpleError(
        403,
        ERROR_CODES.AUTHORIZATION_OWNERSHIP_REQUIRED,
        "Unauthorized: You can only update your own app state"
      );
    }
    // Look up IDs based on names/titles
    let specialtyId = null;
    let subSpecialtyId = null;
    let illustrationId = null;

    // Look up specialty ID if specialty name is provided
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
    }

    // Look up sub-specialty ID if sub-specialty name is provided
    if (body.subSpecialtyName) {
      const { data: subSpecialty, error: subSpecialtyError } = await supabase
        .from("sub_specialties")
        .select("id")
        .eq("name", body.subSpecialtyName)
        .single();

      if (subSpecialtyError) {
        return createAndLogError(
          404,
          ERROR_CODES.NOT_FOUND_SUB_SPECIALTY,
          "Sub-specialty not found",
          subSpecialtyError,
          { subSpecialtyName: body.subSpecialtyName }
        );
      }
      subSpecialtyId = subSpecialty.id;
    }

    // Look up illustration ID if illustration title is provided
    if (body.illustrationTitle) {
      const { data: illustration, error: illustrationError } = await supabase
        .from("illustrations")
        .select("id")
        .eq("name", body.illustrationTitle)
        .single();

      if (illustrationError) {
        return createAndLogError(
          404,
          ERROR_CODES.NOT_FOUND_ILLUSTRATION,
          "Illustration not found",
          illustrationError,
          { illustrationTitle: body.illustrationTitle }
        );
      }
      illustrationId = illustration.id;
    }

    // Prepare update object with only the fields that have IDs
    const updateData = {};
    if (specialtyId !== null) updateData.selected_specialty_id = specialtyId;
    if (subSpecialtyId !== null)
      updateData.selected_sub_specialty_id = subSpecialtyId;
    if (illustrationId !== null)
      updateData.selected_illustration_id = illustrationId;

    // Update the user_app_states table with the derived IDs
    const { error } = await supabase
      .from("user_app_states")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return createAndLogError(
        500,
        ERROR_CODES.UPDATE_FAILED,
        "Failed to update app state",
        error,
        { appStateId: body.id, userId: currentUser.id }
      );
    }

    return {
      statusCode: 204,
      statusText: "No content",
    };
  } catch (error) {
    return createAndLogError(
      500,
      ERROR_CODES.SERVER_ERROR,
      "Internal server error",
      error,
      { function: "update-app-state" }
    );
  }
};
