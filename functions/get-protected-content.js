const faunadb = require("faunadb");
const {
  ContainsPath,
  Get,
  If,
  Index,
  IsNull,
  Lambda,
  Let,
  Map,
  Match,
  Select,
  Var,
} = faunadb.query;
const { getEnvironmentKey } = require("./utils/get-environment-key");
const FAUNA_KEY = getEnvironmentKey("FAUNA_SERVER_KEY", process.env.CONTEXT);

exports.handler = (_, context) => {
  const { user } = context.clientContext;

  try {
    const client = new faunadb.Client({
      secret: process.env[FAUNA_KEY],
    });

    return client
      .query(
        Let(
          {
            userDoc: Get(Match(Index("user_by_netlifyId"), user.sub)),
            appState: Select(["data", "appState"], Var("userDoc")),
            teamDoc: Select(["data", "team"], Var("userDoc")),
            organizationDoc: Get(
              Select(["data", "organization"], Get(Var("teamDoc")))
            ),
            specialtiesDoc: If(
              ContainsPath(["data", "specialties"], Var("organizationDoc")),
              Select(["data", "specialties", "data"], Var("organizationDoc")),
              null
            ),
          },
          {
            appState: Let(
              {
                appStateDoc: Get(Var("appState")),
              },
              {
                id: Select(["ref", "id"], Var("appStateDoc")),
                selectedIllustrationTitle: Select(
                  ["data", "selectedIllustrationTitle"],
                  Var("appStateDoc")
                ),
                selectedSpecialty: Select(
                  ["data", "selectedSpecialty"],
                  Var("appStateDoc")
                ),
                selectedSubSpecialty: Select(
                  ["data", "selectedSubSpecialty"],
                  Var("appStateDoc")
                ),
              }
            ),
            id: Select(["ref", "id"], Var("userDoc")),
            role: Select(["data", "role"], Var("userDoc")),
            team: {
              name: Select(["data", "name"], Get(Var("teamDoc"))),
            },
            organization: {
              subscriptionLevel: Select(
                ["data", "subscriptionLevel"],
                Var("organizationDoc")
              ),
              stripeID: If(
                ContainsPath(["data", "stripeID"], Var("organizationDoc")),
                Select(["data", "stripeID"], Var("organizationDoc")),
                ""
              ),
              name: Select(["data", "name"], Var("organizationDoc")),
            },
            specialties: If(
              IsNull(Var("specialtiesDoc")),
              null,
              Map(
                Var("specialtiesDoc"),
                Lambda(
                  "specialtyRef",
                  Let(
                    {
                      specialtyDoc: Get(Var("specialtyRef")),
                    },
                    {
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
                              name: Select(
                                ["data", "name"],
                                Var("subSpecialtyDoc")
                              ),
                              illustrations: Map(
                                Select(
                                  ["data", "illustrations"],
                                  Var("subSpecialtyDoc")
                                ),
                                Lambda(
                                  "illustrationRef",
                                  Let(
                                    {
                                      illustrationDoc: Get(
                                        Var("illustrationRef")
                                      ),
                                    },
                                    {
                                      name: Select(
                                        ["data", "name"],
                                        Var("illustrationDoc")
                                      ),
                                      alias: Select(
                                        ["data", "alias"],
                                        Var("illustrationDoc")
                                      ),
                                      src: Select(
                                        ["data", "src"],
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
            ),
          }
        )
      )
      .then((response) => {
        return {
          statusCode: 200,
          body: JSON.stringify(response),
        };
      })
      .catch((error) => {
        console.log("::: Get protected content ERROR :::", error);

        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Get protected content: ${error}` }),
        };
      });
  } catch (error) {
    console.log("::: Get Protected content TRY/CATCH ERROR :::", error);

    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook: ${error}` }),
    };
  }
};
