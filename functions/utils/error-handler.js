/**
 * Error handling utility for consistent error responses
 *
 * Provides defense-in-depth error handling:
 * - Generic error messages to clients (security)
 * - Error codes for client-side handling (UX)
 * - Request IDs for support correlation (debugging)
 * - Detailed logging server-side (debugging)
 */

const { randomUUID } = require("crypto");

/**
 * Error code constants
 * Organized by category for easy reference
 */
const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  AUTH_EXPIRED_TOKEN: "AUTH_EXPIRED_TOKEN",

  // Authorization errors
  AUTHORIZATION_INSUFFICIENT_PERMISSIONS:
    "AUTHORIZATION_INSUFFICIENT_PERMISSIONS",
  AUTHORIZATION_OWNERSHIP_REQUIRED: "AUTHORIZATION_OWNERSHIP_REQUIRED",
  AUTHORIZATION_ORGANIZATION_MISMATCH: "AUTHORIZATION_ORGANIZATION_MISMATCH",

  // Validation errors
  VALIDATION_MISSING_FIELD: "VALIDATION_MISSING_FIELD",
  VALIDATION_INVALID_FORMAT: "VALIDATION_INVALID_FORMAT",
  VALIDATION_INVALID_JSON: "VALIDATION_INVALID_JSON",

  // Not found errors
  NOT_FOUND_USER: "NOT_FOUND_USER",
  NOT_FOUND_APP_STATE: "NOT_FOUND_APP_STATE",
  NOT_FOUND_ORGANIZATION: "NOT_FOUND_ORGANIZATION",
  NOT_FOUND_TEAM: "NOT_FOUND_TEAM",
  NOT_FOUND_SPECIALTY: "NOT_FOUND_SPECIALTY",
  NOT_FOUND_SUB_SPECIALTY: "NOT_FOUND_SUB_SPECIALTY",
  NOT_FOUND_ILLUSTRATION: "NOT_FOUND_ILLUSTRATION",

  // Operation failures
  UPDATE_FAILED: "UPDATE_FAILED",
  CREATE_FAILED: "CREATE_FAILED",
  DELETE_FAILED: "DELETE_FAILED",
  FETCH_FAILED: "FETCH_FAILED",

  // Server errors
  SERVER_ERROR: "SERVER_ERROR",
  SERVER_CONFIGURATION_ERROR: "SERVER_CONFIGURATION_ERROR",
};

/**
 * Generates a unique request ID for error correlation
 * @returns {string} UUID request ID
 */
function generateRequestId() {
  return randomUUID();
}

/**
 * Creates a standardized error response
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Error code from ERROR_CODES
 * @param {string} message - Generic error message for client
 * @param {string|null} requestId - Optional request ID for correlation
 * @returns {object} Standardized error response object
 */
function createErrorResponse(statusCode, errorCode, message, requestId = null) {
  const response = {
    error: message,
    errorCode: errorCode,
  };

  if (requestId) {
    response.requestId = requestId;
  }

  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(response),
  };
}

/**
 * Creates an error response with auto-generated request ID
 * Also logs the error server-side with full details
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Error code from ERROR_CODES
 * @param {string} message - Generic error message for client
 * @param {Error|object} error - Error object or error details
 * @param {object} context - Additional context for logging (will be logged but not sent to client)
 * @param {object} headers - Optional custom headers to include in response
 * @returns {object} Standardized error response object
 */
function createAndLogError(
  statusCode,
  errorCode,
  message,
  error = null,
  context = {},
  headers = {}
) {
  const requestId = generateRequestId();

  // Log detailed error server-side
  const logData = {
    requestId,
    errorCode,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (error instanceof Error) {
    logData.error = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  } else if (error !== null) {
    logData.error = error;
  }

  console.error(`[ERROR] ${errorCode}: ${message}`, logData);

  const response = createErrorResponse(
    statusCode,
    errorCode,
    message,
    requestId
  );
  // Merge custom headers if provided
  if (Object.keys(headers).length > 0) {
    response.headers = {
      ...response.headers,
      ...headers,
    };
  }
  return response;
}

/**
 * Creates a simple error response without logging
 * Useful for validation errors that don't need detailed logging
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Error code from ERROR_CODES
 * @param {string} message - Generic error message for client
 * @param {object} headers - Optional custom headers to include in response
 * @returns {object} Standardized error response object
 */
function createSimpleError(statusCode, errorCode, message, headers = {}) {
  const response = createErrorResponse(statusCode, errorCode, message);
  // Merge custom headers if provided
  if (Object.keys(headers).length > 0) {
    response.headers = {
      ...response.headers,
      ...headers,
    };
  }
  return response;
}

module.exports = {
  ERROR_CODES,
  generateRequestId,
  createErrorResponse,
  createAndLogError,
  createSimpleError,
};
