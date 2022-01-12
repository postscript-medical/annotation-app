const faunadb = require("faunadb");
const { Get, Index, Lambda, Let, Map, Match, Paginate, Select, Var } =
  faunadb.query;
const { getEnvironmentKey } = require("./utils/get-environment-key");
const FAUNA_KEY = getEnvironmentKey("FAUNA_SERVER_KEY", process.env.CONTEXT);

exports.handler = () => {
  const client = new faunadb.Client({
    secret: process.env[FAUNA_KEY],
  });

  return client
    .query(
      Map(
        Paginate(Match(Index("all_specialties"))),
        Lambda(
          "ref",
          Let(
            {
              specialtyDoc: Get(Var("ref")),
            },
            {
              id: Select(["ref", "id"], Var("specialtyDoc")),
              name: Select(["data", "name"], Var("specialtyDoc")),
              subSpecialties: Map(
                Select(["data", "subSpecialties"], Var("specialtyDoc")),
                Lambda(
                  "subSpecialtyRef",
                  Let(
                    {
                      subSpecialtyDoc: Get(Var("subSpecialtyRef")),
                    },
                    {
                      id: Select(["ref", "id"], Var("subSpecialtyDoc")),
                      name: Select(["data", "name"], Var("subSpecialtyDoc")),
                      illustrations: Map(
                        Select(
                          ["data", "illustrations"],
                          Var("subSpecialtyDoc")
                        ),
                        Lambda(
                          "illustrationRef",
                          Let(
                            {
                              illustrationDoc: Get(Var("illustrationRef")),
                            },
                            {
                              id: Select(["ref", "id"], Var("illustrationDoc")),
                              name: Select(
                                ["data", "name"],
                                Var("illustrationDoc")
                              ),
                            }
                          )
                        )
                      ),
                    }
                  )
                )
              ),
            }
          )
        )
      )
    )
    .then((response) => {
      return {
        statusCode: 200,
        body: JSON.stringify(response),
      };
    })
    .catch((error) => console.log(":: Get specialties ERROR ::", error));
};
