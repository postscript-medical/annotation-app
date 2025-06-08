const { SUPABASE_DATABASE_URL, SUPABASE_ANON_KEY } = process.env;

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(SUPABASE_DATABASE_URL, SUPABASE_ANON_KEY);

exports.handler = async (_, context) => {
  const { user } = context.clientContext;
  let error;

  console.log("Looking up user with netlify_id:", user.sub);

  // Get user data
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
