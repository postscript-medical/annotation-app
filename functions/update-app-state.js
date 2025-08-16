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
        console.error("Specialty lookup error:", specialtyError);
        throw new Error(`Specialty not found: ${body.specialtyName}`);
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
        console.error("Sub-specialty lookup error:", subSpecialtyError);
        throw new Error(`Sub-specialty not found: ${body.subSpecialtyName}`);
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
        console.error("Illustration lookup error:", illustrationError);
        throw new Error(`Illustration not found: ${body.illustrationTitle}`);
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
