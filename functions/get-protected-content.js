const { SUPABASE_DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

// Validate environment variables
if (!SUPABASE_DATABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing required environment variables: SUPABASE_DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  // For testing purposes, we'll allow the module to load but the handler will return an error
}

const { createClient } = require("@supabase/supabase-js");
const { ERROR_CODES, createAndLogError } = require("./utils/error-handler");
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
  // Check if Supabase client is available
  if (!supabase) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  // Extract token from Authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      statusCode: 401,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Authorization header required" }),
    };
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Validate token with Supabase
    const {
      data: { user },
      error: tokenError,
    } = await supabase.auth.getUser(token);

    if (tokenError || !user) {
      return createAndLogError(
        401,
        ERROR_CODES.AUTH_INVALID_TOKEN,
        "Invalid or expired token",
        tokenError,
        { tokenPrefix: token.substring(0, 10) + "..." },
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    // Get user data by auth_id instead of netlify_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        role,
        show_tutorial,
        team_id,
        teams (
          id,
          name,
          organization_id,
          organizations (
            id,
            name
          )
        )
      `
      )
      .eq("auth_id", user.id)
      .single();

    if (userError || !userData) {
      return createAndLogError(
        404,
        ERROR_CODES.NOT_FOUND_USER,
        "User not found",
        userError,
        { authUserId: user.id },
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    // Get user app state
    const { data: appState, error: appStateError } = await supabase
      .from("user_app_states")
      .select(
        `
      id,
      selected_specialty_id,
      selected_sub_specialty_id,
      selected_illustration_id,
      specialties (
        id,
        name
      ),
      sub_specialties (
        id,
        name
      ),
      illustrations (
        id,
        name,
        src,
        default_illustration,
        illustration_aliases
      )
    `
      )
      .eq("user_id", userData.id)
      .single();

    if (appStateError || !appState) {
      return createAndLogError(
        404,
        ERROR_CODES.NOT_FOUND_APP_STATE,
        "App state not found",
        appStateError,
        { userId: userData.id },
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    // Get all specialties with their sub-specialties and illustrations
    const { data: specialties, error: specialtiesError } = await supabase.from(
      "specialties"
    ).select(`
      id,
      name,
      specialty_sub_specialties (
        sub_specialties (
          id,
          name,
          sub_specialty_illustrations (
            illustrations (
              id,
              name,
              src,
              default_illustration,
              illustration_aliases
            )
          )
        )
      )
    `);

    if (specialtiesError) {
      return createAndLogError(
        500,
        ERROR_CODES.FETCH_FAILED,
        "Failed to fetch specialties",
        specialtiesError,
        { userId: userData.id },
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    if (!specialties || specialties.length === 0) {
      return createAndLogError(
        404,
        ERROR_CODES.NOT_FOUND_SPECIALTY,
        "No specialties found",
        null,
        { userId: userData.id },
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    // Transform the data to match the expected response format
    const transformedSpecialties = specialties.map((specialty) => ({
      id: specialty.id,
      name: specialty.name,
      subSpecialties: specialty.specialty_sub_specialties.map(
        ({ sub_specialties }) => ({
          id: sub_specialties.id,
          name: sub_specialties.name,
          illustrations: sub_specialties.sub_specialty_illustrations.map(
            ({ illustrations }) => ({
              id: illustrations.id,
              name: illustrations.name,
              src: illustrations.src,
              alias: illustrations.illustration_aliases || [],
              defaultIllustration: illustrations.default_illustration,
            })
          ),
        })
      ),
    }));

    const response = {
      id: userData.id,
      role: userData.role,
      team: {
        name: userData.teams.name,
      },
      organization: {
        id: userData.teams.organizations.id,
        name: userData.teams.organizations.name,
      },
      appState: {
        id: appState.id,
        illustration: appState.illustrations,
        specialty: appState.specialties,
        subSpecialty: appState.sub_specialties,
      },
      specialties: transformedSpecialties,
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
      { function: "get-protected-content" },
      { "Access-Control-Allow-Origin": "*" }
    );
  }
};
