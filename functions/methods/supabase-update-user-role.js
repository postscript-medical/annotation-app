const { createClient } = require("@supabase/supabase-js");

exports.supabaseUpdateUserRole = async function supabaseUpdateUserRole(
  supabaseUrl,
  supabaseKey,
  userId,
  role
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

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { roles: [role] },
    });

    if (error) {
      return {
        message: `Error updating user role: ${error.message}`,
        details: {
          status: error.status,
          code: error.code,
        },
      };
    }

    return {
      statusCode: 204,
      user: data.user,
    };
  } catch (error) {
    return {
      message: `Error updating user role: ${error.message}`,
      details: {
        name: error.name,
      },
    };
  }
};
