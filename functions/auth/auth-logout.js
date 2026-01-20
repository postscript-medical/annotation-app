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
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

  // Extract token from Authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      statusCode: 401,
      headers: {
        ...getCorsHeaders(),
      },
      body: JSON.stringify({ error: "Authorization header required" }),
    };
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Establish user session context using USER TOKEN before signOut
    // This ensures the server-side session is properly invalidated
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: "",
    });

    if (!sessionError) {
      // Session established successfully, now sign out
      await supabase.auth.signOut();
    }
    // Token may already be invalid, but we'll still return success

    // Note: Server-side signOut may not fully invalidate the session
    // The token will expire naturally, and client-side session is cleared
    // For full server-side invalidation, consider using Supabase Admin API

    // Return success response
    return {
      statusCode: 200,
      headers: {
        ...getCorsHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Logged out successfully",
        success: true,
      }),
    };
  } catch (error) {
    // Log detailed error server-side for debugging
    console.error("Unexpected error during logout:", {
      error: error.message,
      stack: error.stack,
      tokenPrefix: token ? token.substring(0, 10) + "..." : "no token",
      timestamp: new Date().toISOString(),
      ip:
        event.headers["x-forwarded-for"] ||
        event.headers["x-real-ip"] ||
        "unknown",
    });

    // Even if there's an unexpected error, we should still return success
    // because the client-side session should be cleared regardless
    return {
      statusCode: 200,
      headers: {
        ...getCorsHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Logged out successfully",
        success: true,
      }),
    };
  }
};
