const { createClient } = require("@supabase/supabase-js");

exports.supabaseCreateUser = async function supabaseCreateUser(
  supabaseUrl,
  supabaseKey,
  email,
  password,
  confirm = false
) {
  try {
    // Initialize the Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: confirm,
      user_metadata: {
        created_by: "admin",
      },
    });

    if (error) {
      return {
        message: `Error creating user: ${error.message}`,
        details: {
          status: error.status,
          code: error.code,
        },
      };
    }

    return {
      user: data.user,
    };
  } catch (error) {
    return {
      message: `Error creating user: ${error.message}`,
      details: {
        name: error.name,
      },
    };
  }
};
