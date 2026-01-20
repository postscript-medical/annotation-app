const { createClient } = require("@supabase/supabase-js");

exports.handler = async () => {
  console.log("=== Handler Started ===");
  console.log("Environment variables:", {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY_EXISTS: !!process.env.SUPABASE_KEY,
  });

  try {
    console.log("Creating Supabase client...");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    console.log("Preparing database query...");
    const query = supabase
      .from("illustration_raw")
      .select("id, fauna_id, data")
      .limit(1);

    console.log("Query details:", {
      table: "illustration_raw",
      columns: ["id", "fauna_id", "data"],
      limit: 1,
    });

    console.log("Executing query...");
    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    console.log("Query result:", {
      hasData: !!data,
      dataLength: data ? data.length : 0,
      firstRecord: data && data.length > 0 ? data[0] : null,
    });

    if (!data || data.length === 0) {
      console.log("No records found");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No records found" }),
      };
    }

    const record = data[0];
    const response = {
      id: record.fauna_id,
      name: record.data.data.name,
      src: record.data.data.src,
      alias: record.data.data.alias || [],
    };

    console.log("Preparing response:", response);
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("=== Unexpected Error ===");
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
