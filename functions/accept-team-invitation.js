const { SUPABASE_DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

const { createClient } = require("@supabase/supabase-js");

// Helper function to get CORS headers
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: "",
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Validate Supabase environment variables
  if (!SUPABASE_DATABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { token, password } = body;

  // Validate required fields
  if (!token || !password) {
    return {
      statusCode: 400,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: "Token and password are required" }),
    };
  }

  // Validate password strength (matches frontend requirements)
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isValidLength = password.length >= 8;

  if (!isValidLength || !hasNumber || !hasSpecialChar) {
    return {
      statusCode: 400,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: "Password does not meet requirements" }),
    };
  }

  try {
    // Create Supabase client with SERVICE_ROLE_KEY
    const supabase = createClient(
      SUPABASE_DATABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Supabase invitation tokens can be verified with verifyOtp using type 'invite'
    // The token from the email link needs to be extracted from the URL hash
    // For invitation acceptance, we need to verify the OTP and then set the password

    // Try to verify as invitation OTP token
    // Note: Supabase invitation emails contain tokens in the URL hash that need to be extracted
    // The token parameter from the frontend should be the hash token from the URL
    const { data: verifyData, error: verifyError } =
      await supabase.auth.verifyOtp({
        token_hash: token,
        type: "invite",
      });

    if (verifyError || !verifyData?.user) {
      // If verifyOtp fails, try alternative: the token might be in a different format
      // Some Supabase invitation flows use access tokens directly
      // Alternative: Try to use the token as an access token to get user info
      // Then update password if we can establish a session
      const { data: userData, error: userError } = await supabase.auth.getUser(
        token
      );

      if (userError || !userData?.user) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(),
          body: JSON.stringify({
            error: "Invalid or expired invitation token",
          }),
        };
      }

      // If we got the user, try to set session and update password
      // Note: This may not work if the token doesn't have sufficient permissions
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: "",
      });

      if (sessionError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(),
          body: JSON.stringify({
            error: "Invalid or expired invitation token",
          }),
        };
      }
    } else {
      // OTP verified successfully, set the session
      if (verifyData.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: verifyData.session.access_token,
          refresh_token: verifyData.session.refresh_token,
        });

        if (sessionError) {
          return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({ error: "Failed to establish session" }),
          };
        }
      }
    }

    // Update the user's password
    // updateUser requires an active session context
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      console.error("Password update error:", {
        error: updateError.message,
        errorCode: updateError.status,
        timestamp: new Date().toISOString(),
      });

      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error:
            updateError.message.includes("token") ||
            updateError.message.includes("expired")
              ? "Invalid or expired invitation link"
              : "Failed to set password",
        }),
      };
    }

    // Get the updated user data
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        statusCode: 500,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: "Failed to retrieve user data" }),
      };
    }

    // Return user data in the format expected by the frontend
    return {
      statusCode: 200,
      headers: {
        ...getCorsHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      }),
    };
  } catch (error) {
    console.error("Unexpected error during invitation acceptance:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
