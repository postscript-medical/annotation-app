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

// Helper function to add consistent delay for error responses to prevent timing attacks
const addErrorDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 100));

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
      headers: {
        ...getCorsHeaders(),
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
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
    // Tokens from Supabase can be in different formats:
    // 1. Regular access tokens (most common - ~99% of requests) - use getUser()
    // 2. Recovery tokens (from password reset emails) - need verifyOtp first
    // 3. Access tokens that need setSession first

    let userData = null;
    let accessToken = token;

    // Optimize for common case: Try getUser() first (fastest path for normal sessions)
    const { data: getUserData, error: getUserError } =
      await supabase.auth.getUser(token);

    if (!getUserError && getUserData?.user) {
      // Normal session token - return immediately (fast path)
      userData = getUserData.user;
      accessToken = token;
    } else {
      // Not a normal session token - try recovery token handling (fallback for password reset)
      const { data: verifyData, error: verifyError } =
        await supabase.auth.verifyOtp({
          token_hash: token,
          type: "recovery",
        });

      if (!verifyError && verifyData?.session) {
        // Recovery token verified successfully, get user from session
        userData = verifyData.session.user;
        accessToken = verifyData.session.access_token;
      } else {
        // If recovery token verification fails, try setSession as last resort
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: "",
          });

        if (!sessionError && sessionData?.session?.user) {
          userData = sessionData.session.user;
          accessToken = sessionData.session.access_token;
        } else {
          // All methods failed - log for debugging
          console.error("[auth-session] All validation methods failed:", {
            getUserError: getUserError?.message,
            verifyError: verifyError?.message,
            sessionError: sessionError?.message,
          });

          // Add consistent delay for error responses to prevent timing attacks
          await addErrorDelay();

          // Return generic error message to client
          return {
            statusCode: 401,
            headers: {
              ...getCorsHeaders(),
            },
            body: JSON.stringify({ error: "Session expired or invalid" }),
          };
        }
      }
    }

    if (!userData) {
      return {
        statusCode: 401,
        headers: {
          ...getCorsHeaders(),
        },
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    // Return user session data
    const response = {
      user: {
        id: userData.id,
        email: userData.email,
        email_confirmed_at: userData.email_confirmed_at,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      },
      access_token: accessToken,
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
    console.error("Unexpected error during session validation:", {
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
