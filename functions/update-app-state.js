// const faunadb = require("faunadb");
// const { Update, Ref, Collection } = faunadb.query;
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

    // First, fetch the existing record using the fauna_id column
    const { data: existingRecord, error: fetchError } = await supabase
      .from("user_app_state_raw")
      .select("*")
      .eq("fauna_id", body.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!existingRecord) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "App state record not found" }),
      };
    }

    // Create new data object maintaining the exact structure from the example
    const updatedData = {
      ref: existingRecord.data.ref,
      ts: existingRecord.data.ts,
      data: {
        ...existingRecord.data.data,
        selectedIllustrationTitle: body.selectedIllustrationTitle,
        selectedSpecialty: body.selectedSpecialty,
        selectedSubSpecialty: body.selectedSubSpecialty,
      },
    };

    // Update the record
    const { data: updatedRecord, error: updateError } = await supabase
      .from("user_app_state_raw")
      .update({
        data: updatedData,
        updated_at: new Date().toISOString(), // Only update the table column
      })
      .eq("fauna_id", body.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const mappedUpdatedRecord = {
      selectedIllustrationTitle:
        updatedRecord.data.data.selectedIllustrationTitle,
      selectedSpecialty: updatedRecord.data.data.selectedSpecialty,
      selectedSubSpecialty: updatedRecord.data.data.selectedSubSpecialty,
      id: body.id,
    };

    // Return only the JSON data structure, not the table columns
    return {
      statusCode: 200,
      body: JSON.stringify(mappedUpdatedRecord),
    };
  } catch (error) {
    console.error("::: Update app state ERROR :::", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// exports.handler = (event) => {
//   let body;

//   try {
//     body = JSON.parse(event.body);
//   } catch (error) {
//     console.log("::: ERROR :::", event);

//     return {
//       statusCode: 400,
//       body: `::: ERROR - Invalid JSON - ::: ${error.message}`,
//     };
//   }

//   const client = new faunadb.Client({
//     secret: process.env.FAUNA_KEY,
//   });

//   return client
//     .query(
//       Update(Ref(Collection("UserAppState"), body.id), {
//         data: {
//           selectedIllustrationTitle: body.selectedIllustrationTitle,
//           selectedSpecialty: body.selectedSpecialty,
//           selectedSubSpecialty: body.selectedSubSpecialty,
//         },
//       })
//     )
//     .then((response) => {
//       response.data.id = body.id;

//       return {
//         statusCode: 200,
//         body: JSON.stringify(response),
//       };
//     })
//     .catch((error) => console.log("::: Update app state ERROR :::", error));
// };
