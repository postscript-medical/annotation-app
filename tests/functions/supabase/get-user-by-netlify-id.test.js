const {
  handler,
} = require("../../../functions/supabase/get-user-by-netlify-id");
const fs = require("fs");
const path = require("path");

async function main() {
  // Ensure environment variables are set
  if (!process.env.SUPABASE_KEY || !process.env.SUPABASE_URL) {
    throw new Error(
      "SUPABASE_KEY and SUPABASE_URL environment variables must be set"
    );
  }

  // Set up test runner
  const testRunner = {
    clientContext: {
      user: {
        sub:
          process.env.TEST_USER_NETLIFYID ||
          "c2faa7fd-0c23-4bae-867a-62be1f2d80c2", // Default test user
      },
    },
  };

  // Create test outputs directory
  const testOutputDir = path.join(
    __dirname,
    "../../../../test-outputs/supabase/get-user-by-netlify-id"
  );
  if (!fs.existsSync(testOutputDir)) {
    fs.mkdirSync(testOutputDir, { recursive: true });
  }

  // Clean up old test outputs
  fs.readdirSync(testOutputDir).forEach((file) => {
    fs.unlinkSync(path.join(testOutputDir, file));
  });

  // Save environment info
  fs.writeFileSync(
    path.join(testOutputDir, "environment.json"),
    JSON.stringify(
      {
        SUPABASE_URL: process.env.SUPABASE_URL,
        TEST_USER_ID:
          process.env.TEST_USER_NETLIFY_ID ||
          "c2faa7fd-0c23-4bae-867a-62be1f2d80c2",
      },
      null,
      2
    )
  );

  console.log("Starting test runner...");
  console.log("Cleaned up old test outputs in:", testOutputDir);

  // Execute handler
  console.log("\nExecuting handler...");
  const response = await handler({}, testRunner);

  // Save response
  fs.writeFileSync(
    path.join(testOutputDir, "handler-response.json"),
    JSON.stringify(response, null, 2)
  );

  // Parse and save response body
  const responseBody = JSON.parse(response.body);
  fs.writeFileSync(
    path.join(testOutputDir, "handler-response-body.json"),
    JSON.stringify(responseBody, null, 2)
  );

  console.log("Function completed successfully");
  console.log("Response:", response);
  console.log(
    "Output saved to:",
    path.join(testOutputDir, "handler-response.json")
  );
  console.log(
    "Output saved to:",
    path.join(testOutputDir, "handler-response-body.json")
  );

  // Validate response
  if (response.statusCode !== 200) {
    throw new Error(`Unexpected status code: ${response.statusCode}`);
  }

  if (!responseBody.data) {
    throw new Error("Response missing user data");
  }

  if (!responseBody.data.data) {
    throw new Error("Response missing nested data");
  }

  if (!responseBody.data.data.netlifyID) {
    throw new Error("Response missing netlifyID");
  }

  // Validate app state data
  if (!responseBody.appState) {
    throw new Error("Response missing app state data");
  }

  if (!responseBody.appState.id) {
    throw new Error("Response missing app state ID");
  }

  if (!responseBody.appState.selectedIllustrationTitle) {
    throw new Error("Response missing selectedIllustrationTitle");
  }

  if (!responseBody.appState.selectedSpecialty) {
    throw new Error("Response missing selectedSpecialty");
  }

  if (!responseBody.appState.selectedSubSpecialty) {
    throw new Error("Response missing selectedSubSpecialty");
  }

  console.log("Test passed successfully!");
}

main().catch((error) => {
  console.error("Test failed with error:", error);
  process.exit(1);
});
