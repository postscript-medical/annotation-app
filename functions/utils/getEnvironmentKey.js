exports.getEnvironmentKey = (key, environment) => {
  if (environment.CONTEXT !== "production") {
    return key + "_DEV";
  }

  return key;
};
