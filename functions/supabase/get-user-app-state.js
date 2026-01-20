const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event, context) => {
  const { user } = context.clientContext;
  console.log("=== Get User App State Handler Started ===");
  console.log("User:", user);

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Get the user data which includes the app state reference
    console.log("Getting user data...");
    const { data: userData, error: userError } = await supabase
      .from("user_raw")
      .select("data")
      .contains("data", { data: { netlifyID: user.sub } })
      .single();

    if (userError) {
      console.error("User query error:", userError);
      throw userError;
    }

    if (!userData) {
      throw new Error(`No user found with netlifyID: ${user.sub}`);
    }

    console.log("User data retrieved:", JSON.stringify(userData, null, 2));

    // Get the app state using the reference from user data
    const appStateId = userData.data.data.appState["@ref"].id;
    console.log("Getting app state with ID:", appStateId);

    const { data: appStateData, error: appStateError } = await supabase
      .from("user_app_state_raw")
      .select("data")
      .eq('data->resource->data->ref->"@ref"->id', appStateId);
    //  .single();

    if (appStateError) {
      console.error("App state query error:", appStateError);
      throw appStateError;
    }

    if (!appStateData) {
      throw new Error(`No app state found with ID: ${appStateId}`);
    }

    console.log("App state retrieved:", JSON.stringify(appStateData, null, 2));

    // Transform the response to match the expected format
    const response = {
      id: appStateData.data.ref["@ref"].id,
      selectedIllustrationTitle:
        appStateData.data.data.selectedIllustrationTitle,
      selectedSpecialty: appStateData.data.data.selectedSpecialty,
      selectedSubSpecialty: appStateData.data.data.selectedSubSpecialty,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("=== Error in get-user-app-state ===");
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Get user app state: ${error.message}` }),
    };
  }
};
