const { SUPABASE_DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

const { createClient } = require("@supabase/supabase-js");
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

exports.handler = async (_, context) => {
  const { user } = context.clientContext;
  let error;

  console.log("Looking up user with netlify_id:", user.sub);

  // Get user data with team info
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
        organization_id
      )
    `
    )
    .eq("netlify_id", user.sub)
    .single();

  if (userError) {
    console.error("Error fetching user:", userError);
    error = userError;
  }

  if (!userData) {
    console.error("No user found with netlify_id:", user.sub);
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "User not found" }),
    };
  }

  console.log("Found user:", { id: userData.id, email: userData.email });

  // Get organization data with available_specialties field
  let organizationData = null;
  let hasMultipleSpecialties = false;
  let hasPrimarySpecialty = false;

  if (userData.teams?.organization_id) {
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select(
        `
        id, 
        name,
        available_specialties
      `
      )
      .eq("id", userData.teams.organization_id)
      .limit(1);

    if (orgError) {
      console.error("Error fetching organization:", orgError);
      // Don't set error here, just log it and continue
    } else if (orgData && orgData.length > 0) {
      organizationData = orgData[0];

      // Determine specialty access based on available_specialties field
      if (organizationData.available_specialties === "all") {
        hasMultipleSpecialties = true; // All specialties available
        hasPrimarySpecialty = false; // No primary specialty concept
      } else if (organizationData.available_specialties === "restricted") {
        // Future implementation: check restricted_organization_specialties table
        hasMultipleSpecialties = false;
        hasPrimarySpecialty = false;
      }

      console.log("Organization specialty access:", {
        available_specialties: organizationData.available_specialties,
        hasMultipleSpecialties,
        hasPrimarySpecialty,
      });
    } else {
      console.log(
        "No organization found for organization_id:",
        userData.teams.organization_id
      );
    }
  } else {
    console.log("No organization_id found in team data");
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

  if (appStateError) {
    console.error("Error fetching app state:", appStateError);
    error = appStateError;
  }

  if (!appState) {
    console.error("No app state found for user:", userData.id);
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "App state not found" }),
    };
  }

  console.log("Found app state:", { id: appState.id });

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
    console.error("Error fetching specialties:", specialtiesError);
    error = specialtiesError;
  }

  if (!specialties || specialties.length === 0) {
    console.error("No specialties found");
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "No specialties found" }),
    };
  }

  console.log("Found specialties:", { count: specialties.length });

  // Transform the data to match the expected response format
  const transformedSpecialties = specialties.map((specialty) => ({
    name: specialty.name,
    subSpecialties: specialty.specialty_sub_specialties.map((ss) => ({
      name: ss.sub_specialties.name,
      illustrations: ss.sub_specialties.sub_specialty_illustrations.map(
        (si) => ({
          name: si.illustrations.name,
          src: si.illustrations.src,
          alias: si.illustrations.illustration_aliases || [],
          defaultIllustration: si.illustrations.default_illustration,
        })
      ),
    })),
  }));

  // Determine the access mode based on available_specialties field
  let primarySpecialtyName = null;
  let accessMode = "restricted";

  if (organizationData?.available_specialties) {
    if (organizationData.available_specialties === "all") {
      // All specialties available - equivalent to old 'all' value
      primarySpecialtyName = "all";
      accessMode = "all_specialties";
    } else if (organizationData.available_specialties === "restricted") {
      // Future implementation: check restricted_organization_specialties table
      // For now, treat as restricted
      accessMode = "restricted";
    }
  }

  const response = {
    id: userData.id,
    role: userData.role,
    team: {
      name: userData.teams.name,
    },
    organization: organizationData
      ? {
          id: organizationData.id,
          name: organizationData.name,
          chosenSpecialty: primarySpecialtyName,
          accessMode: accessMode,
          hasMultipleSpecialties: hasMultipleSpecialties,
          hasPrimarySpecialty: hasPrimarySpecialty,
        }
      : null,
    appState: {
      id: appState.id,
      selectedIllustrationTitle: appState.illustrations?.name,
      selectedSpecialty: appState.specialties?.name,
      selectedSubSpecialty: appState.sub_specialties?.name,
    },
    specialties: transformedSpecialties,
  };

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};
