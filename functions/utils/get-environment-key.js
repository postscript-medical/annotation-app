exports.getEnvironmentKey = (key, context) =>
  (context === "production" ? "PROD_" : "DEV_") + key;
