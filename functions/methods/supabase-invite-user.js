const { createClient } = require("@supabase/supabase-js");

exports.supabaseInviteUser = async function supabaseInviteUser(
  supabaseUrl,
  supabaseKey,
  email
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

    const siteUrl = process.env.SITE_URL || "http://localhost:8888";
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/#/accept-team-invitation`,
      data: {
        invited_by: "admin",
      },
    });

    if (error) {
      return {
        message: `Error inviting user: ${error.message}`,
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
      message: `Error inviting user: ${error.message}`,
      details: {
        name: error.name,
      },
    };
  }
};
