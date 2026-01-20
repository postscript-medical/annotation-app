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

  const { refresh_token } = body;

  // Validate required fields
  if (!refresh_token) {
    return {
      statusCode: 400,
      headers: {
        ...getCorsHeaders(),
      },
      body: JSON.stringify({ error: "Refresh token is required" }),
    };
  }

  try {
    // Refresh the session using the refresh token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      // Log detailed error server-side for debugging
      console.error("Session refresh error:", {
        error: error.message,
        errorCode: error.status,
        timestamp: new Date().toISOString(),
        tokenPrefix: refresh_token.substring(0, 10) + "...",
      });

      // Add consistent delay for error responses to prevent timing attacks
      await addErrorDelay();

      // Return generic error message to prevent information disclosure
      return {
        statusCode: 401,
        headers: {
          ...getCorsHeaders(),
        },
        body: JSON.stringify({ error: "Session refresh failed" }),
      };
    }

    if (!data.session || !data.user) {
      return {
        statusCode: 401,
        headers: {
          ...getCorsHeaders(),
        },
        body: JSON.stringify({ error: "Session refresh failed" }),
      };
    }

    // Return new session data
    const response = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at,
      },
    };

    return {
      statusCode: 200,
      headers: {
        ...getCorsHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    // Log detailed error server-side for debugging
    console.error("Unexpected error during session refresh:", {
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
