const { SUPABASE_DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGINS } =
  process.env;

// Helper function to get CORS headers
function getCorsHeaders() {
  const allowedOrigins = ALLOWED_ORIGINS
    ? ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : ["*"]; // Default to wildcard for development

  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes("*")
      ? "*"
      : allowedOrigins[0] || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Validate environment variables
if (!SUPABASE_DATABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing required environment variables: SUPABASE_DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  // For testing purposes, we'll allow the module to load but the handler will return an error
}

const { createClient } = require("@supabase/supabase-js");
const supabase =
  SUPABASE_DATABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })
    : null;

exports.handler = async (event) => {
  // Check if Supabase client is available
  if (!supabase) {
    const missingVar = !SUPABASE_DATABASE_URL
      ? "SUPABASE_DATABASE_URL"
      : "SUPABASE_SERVICE_ROLE_KEY";
    console.error(
      `[auth-password-reset] Missing required environment variable: ${missingVar}`
    );
    console.error(
      `[auth-password-reset] Please set ${missingVar} in your environment variables.`
    );
    console.error(
      `[auth-password-reset] For local development, add it to your .env file.`
    );
    console.error(
      `[auth-password-reset] For Netlify, set it in Site Settings → Environment Variables.`
    );
    return {
      statusCode: 500,
      headers: {
        ...getCorsHeaders(),
      },
      body: JSON.stringify({
        error: "Server configuration error",
        details: `Missing required environment variable: ${missingVar}. Please set SUPABASE_SERVICE_ROLE_KEY in your environment.`,
      }),
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

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: "",
    };
  }

  // Helper function to add consistent delay for error responses to prevent timing attacks
  const addErrorDelay = () =>
    new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 100));

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        ...getCorsHeaders(),
      },
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { token, password } = body;

  // Validate required fields
  if (!token || !password) {
    return {
      statusCode: 400,
      headers: {
        ...getCorsHeaders(),
      },
      body: JSON.stringify({ error: "Token and password are required" }),
    };
  }

  // Validate password strength
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isValidLength = password.length >= 8;

  if (!isValidLength || !hasNumber || !hasSpecialChar) {
    // Add consistent delay for error responses to prevent timing attacks
    await addErrorDelay();

    // Return generic error to prevent revealing specific requirements
    return {
      statusCode: 400,
      headers: {
        ...getCorsHeaders(),
      },
      body: JSON.stringify({ error: "Password does not meet requirements" }),
    };
  }

  try {
    // Extract user ID from token using getUser() with SERVICE_ROLE_KEY
    // This validates the token and returns user info without requiring a session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("[auth-password-reset] Failed to get user from token:", {
        error: userError?.message,
        errorCode: userError?.status,
      });

      // Add consistent delay for error responses to prevent timing attacks
      await addErrorDelay();

      return {
        statusCode: 400,
        headers: {
          ...getCorsHeaders(),
        },
        body: JSON.stringify({ error: "Invalid or expired reset link" }),
      };
    }

    // Update password using Admin API - no session required
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: password }
    );

    if (updateError) {
      console.error("[auth-password-reset] Password update error:", {
        error: updateError.message,
        errorCode: updateError.status,
        userId: user.id,
      });

      // Add consistent delay for error responses to prevent timing attacks
      await addErrorDelay();

      return {
        statusCode: 400,
        headers: {
          ...getCorsHeaders(),
        },
        body: JSON.stringify({
          error: "Failed to update password",
        }),
      };
    }

    // Return success response
    return {
      statusCode: 200,
      headers: {
        ...getCorsHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Password updated successfully",
        success: true,
      }),
    };
  } catch (error) {
    // Log detailed error server-side for debugging
    console.error("Unexpected error during password reset:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return {
      statusCode: 500,
      headers: {
        ...getCorsHeaders(),
      },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
