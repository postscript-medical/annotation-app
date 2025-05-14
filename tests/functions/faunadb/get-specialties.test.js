require("dotenv").config();
const { handler } = require("../../../functions/get-specialties");
const TestRunner = require("../common/test-runner");

async function main() {
  // Validate environment variables
  if (!process.env.FAUNA_KEY) {
    console.error("Error: FAUNA_KEY environment variable is not set");
    process.exit(1);
  }

  // Validate key format
  const faunaKey = process.env.FAUNA_KEY.trim();
  if (!faunaKey.startsWith("fn")) {
    console.error(
      'Error: FAUNA_KEY appears to be invalid - should start with "fn"'
    );
    process.exit(1);
  }

  const runner = new TestRunner({
    dbType: "faunadb",
    functionName: "get-specialties",
    handler,
    event: {
      FAUNA_KEY: faunaKey,
    },
  });

  await runner.run();
}

// Run the main function
main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
