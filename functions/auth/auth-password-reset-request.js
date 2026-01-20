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
    return {
      statusCode: 500,
      headers: {
        ...getCorsHeaders(),
      },
      body: JSON.stringify({ error: "Server configuration error" }),
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

  const { email } = body;

  // Validate required fields
  if (!email) {
    return {
      statusCode: 400,
      headers: {
        ...getCorsHeaders(),
      },
      body: JSON.stringify({ error: "Email is required" }),
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      statusCode: 400,
      headers: {
        ...getCorsHeaders(),
      },
      body: JSON.stringify({ error: "Invalid email format" }),
    };
  }

  try {
    // Request password reset email from Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: `${
          process.env.SITE_URL || "http://localhost:8888"
        }/#/reset-password`,
      }
    );

    if (error) {
      // Log detailed error server-side for debugging
      console.error("Password reset request error:", {
        error: error.message,
        errorCode: error.status,
        email: email.toLowerCase().trim(),
        timestamp: new Date().toISOString(),
        ip:
          event.headers["x-forwarded-for"] ||
          event.headers["x-real-ip"] ||
          "unknown",
      });

      // Don't reveal if the email exists or not for security reasons
      // Always return success to prevent email enumeration attacks
    }

    // Always return success to prevent email enumeration attacks
    return {
      statusCode: 200,
      headers: {
        ...getCorsHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message:
          "If an account with that email exists, a password reset link has been sent.",
        success: true,
      }),
    };
  } catch (error) {
    // Log detailed error server-side for debugging
    console.error("Unexpected error during password reset request:", {
      error: error.message,
      stack: error.stack,
      email: body?.email || "unknown",
      timestamp: new Date().toISOString(),
      ip:
        event.headers["x-forwarded-for"] ||
        event.headers["x-real-ip"] ||
        "unknown",
    });

    // Even if there's an unexpected error, return success to prevent email enumeration
    return {
      statusCode: 200,
      headers: {
        ...getCorsHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message:
          "If an account with that email exists, a password reset link has been sent.",
        success: true,
      }),
    };
  }
};
