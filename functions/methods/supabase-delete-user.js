const { createClient } = require("@supabase/supabase-js");

exports.supabaseDeleteUser = async function supabaseDeleteUser(
  supabaseUrl,
  supabaseKey,
  userId
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

    const { data, error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      return {
        message: `Error deleting user: ${error.message}`,
        details: {
          status: error.status,
          code: error.code,
        },
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    return {
      message: `Error deleting user: ${error.message}`,
      details: {
        name: error.name,
      },
    };
  }
};
