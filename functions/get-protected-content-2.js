const faunadb = require("faunadb");
const { Get, Index, Lambda, Let, Map, Match, Select, Var } = faunadb.query;

exports.handler = (_, context) => {
  const { user } = context.clientContext;

  try {
    const client = new faunadb.Client({
      secret: process.env.FAUNA_SERVER_KEY,
    });

    return client
      .query(
        Let(
          {
            userDoc: Get(Match(Index("findUserByNetlifyID"), user.sub)),
            appState: Select(["data", "appState"], Var("userDoc")),
            team: Select(["data", "team"], Var("userDoc")),
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
            team: Let(
              {
                teamDoc: Get(Var("team")),
                specialtiesDoc: Select(["data", "specialties"], Var("teamDoc")),
              },
              {
                name: Select(["data", "name"], Var("teamDoc")),
                organization: Let(
                  {
                    organizationDoc: Get(
                      Select(["data", "organization"], Var("teamDoc"))
                    ),
                  },
                  {
                    subscriptionLevel: Select(
                      ["data", "subscriptionLevel"],
                      Var("organizationDoc")
                    ),
                  }
                ),
                specialties: Map(
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
                          Select(
                            ["data", "subSpecialties"],
                            Var("specialtyDoc")
                          ),
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
                ),
              }
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
        console.log("::: Get Protected content ERROR :::", error);

        return {
          statusCode: 400,
          body: `Webohook Error: ${error}`,
        };
      });
  } catch (error) {
    console.log(":: ERROR :: [get-protected-content-2] >>>", error);

    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  }
};
