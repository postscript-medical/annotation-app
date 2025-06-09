const { SUPABASE_DATABASE_URL, SUPABASE_ANON_KEY } = process.env;

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(SUPABASE_DATABASE_URL, SUPABASE_ANON_KEY);

exports.handler = async (event) => {
  let body;

  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.log("::: ERROR :::", event);
    return {
      statusCode: 400,
      body: `::: ERROR - Invalid JSON - ::: ${error.message}`,
    };
  }

  try {
    console.log("[Main script] App State Id: ", body.id);

    const { error } = await supabase
      .from("user_app_states")
      .update({
        selected_specialty_id: body.specialtyId,
        selected_sub_specialty_id: body.subSpecialtyId,
        selected_illustration_id: body.illustrationId,
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 204,
      statusText: "No content",
    };
  } catch (error) {
    console.error("::: Update app state ERROR :::", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
