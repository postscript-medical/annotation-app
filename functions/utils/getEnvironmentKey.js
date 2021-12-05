exports.getEnvironmentKey = (key, environment) => {
  if (environment.CONTEXT !== "production") {
    return "DEV_" + key;
  }

  return key;
};
