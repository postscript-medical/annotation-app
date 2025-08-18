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
    // Look up specialty ID if specialty name is provided
    let specialtyId = null;

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
    } else if (body.specialtyId) {
      // If specialtyId is provided directly, use it
      specialtyId = body.specialtyId;
    } else {
      throw new Error("Either specialtyName or specialtyId must be provided");
    }

    // Update the organizations table with the chosen specialty
    const { error } = await supabase
      .from("organizations")
      .update({ chosen_specialty: specialtyId })
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, chosen_specialty: specialtyId }),
    };
  } catch (error) {
    console.error("::: Update chosen specialty ERROR :::", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
