const { createClient } = require("@supabase/supabase-js");

exports.handler = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  try {
    // Get all specialties
    const { data: specialties, error: specialtiesError } = await supabase
      .from("specialty_raw")
      .select("id, fauna_id, data");

    if (specialtiesError) throw specialtiesError;

    // Get all sub-specialties
    const { data: subSpecialties, error: subSpecialtiesError } = await supabase
      .from("sub_specialty_raw")
      .select("id, fauna_id, data");

    if (subSpecialtiesError) throw subSpecialtiesError;

    // Get all illustrations
    const { data: illustrations, error: illustrationsError } = await supabase
      .from("illustration_raw")
      .select("id, fauna_id, data");

    if (illustrationsError) throw illustrationsError;

    // Transform the data to match the expected format
    const transformedSpecialties = specialties.map((specialty) => {
      // Get the sub-specialty IDs from the specialty's data
      const subSpecialtyRefs = specialty.data.data.subSpecialties || [];
      const subSpecialtyIds = subSpecialtyRefs.map((ref) => ref["@ref"].id);

      // Find matching sub-specialties
      const specialtySubSpecialties = subSpecialties
        .filter((subSpecialty) =>
          subSpecialtyIds.includes(subSpecialty.fauna_id)
        )
        .map((subSpecialty) => {
          // Get the illustration IDs from the sub-specialty's data
          const illustrationRefs = subSpecialty.data.data.illustrations || [];
          const illustrationIds = illustrationRefs.map((ref) => ref["@ref"].id);

          // Find matching illustrations
          const subSpecialtyIllustrations = illustrations
            .filter((illustration) =>
              illustrationIds.includes(illustration.fauna_id)
            )
            .map((illustration) => ({
              id: illustration.fauna_id,
              name: illustration.data.data.name,
            }));

          return {
            id: subSpecialty.fauna_id,
            name: subSpecialty.data.data.name,
            illustrations: subSpecialtyIllustrations,
          };
        });

      return {
        id: specialty.fauna_id,
        name: specialty.data.data.name,
        subSpecialties: specialtySubSpecialties,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(transformedSpecialties),
    };
  } catch (error) {
    console.error(":: Get specialties ERROR ::", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
