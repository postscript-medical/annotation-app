const { getEnvironmentKey } = require("./utils/get-environment-key");

exports.handler = async () => {
  console.log(
    "Identity signup webhook:",
    getEnvironmentKey("FAUNA_SERVER_KEY", process.env.CONTEXT)
  );

  return {
    statusCode: 200,
    body: "All good",
  };
};
