const fetch = require("node-fetch");
const { getEnvironmentKey } = require("./utils/getEnvironmentKey");
const FAUNA_KEY = getEnvironmentKey("FAUNA_SERVER_KEY", process.env);

exports.faunaFetch = async ({ query, variables }) => {
  return await fetch("https://graphql.fauna.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env[FAUNA_KEY]}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })
    .then((res) => res.json())
    .catch((err) => console.error(JSON.stringify(err, null, 2)));
};
