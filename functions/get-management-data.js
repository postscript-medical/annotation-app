const faunadb = require("faunadb");
const {
  ContainsPath,
  Get,
  If,
  Index,
  Join,
  Lambda,
  Let,
  Map,
  Match,
  Paginate,
  Select,
  Var,
} = faunadb.query;

exports.handler = (_, context) => {
  const { user } = context.clientContext;

  try {
    const client = new faunadb.Client({
      secret: process.env.FAUNA_KEY,
    });

    return client
      .query(
        Let(
          {
            userDoc: Get(Match(Index("user_by_netlifyId"), user.sub)),
            teamDoc: Get(Select(["data", "team"], Var("userDoc"))),
            organizationId: Select(["data", "organization"], Var("userDoc")),
            organizationDoc: Get(Var("organizationId")),
          },
          {
            allMembers: Map(
              Paginate(
                Join(
                  Match(
                    Index("all_members_by_organization"),
                    Var("organizationId")
                  ),
                  Index("members_sort_by_first_name_asc")
                ),
                {
                  size: 300,
                }
              ),
              Lambda(
                ["firstName", "ref"],
                Let(
                  {
                    memberDoc: Get(Var("ref")),
                  },
                  {
                    email: Select(["data", "email"], Var("memberDoc")),
                    firstName: If(
                      ContainsPath(["data", "firstName"], Var("memberDoc")),
                      Select(["data", "firstName"], Var("memberDoc")),
                      ""
                    ),
                    id: Select(["ref", "id"], Var("memberDoc")),
                    lastName: If(
                      ContainsPath(["data", "lastName"], Var("memberDoc")),
                      Select(["data", "lastName"], Var("memberDoc")),
                      ""
                    ),
                    netlifyID: Select(["data", "netlifyID"], Var("memberDoc")),
                    role: Select(["data", "role"], Var("memberDoc")),
                  }
                )
              )
            ),
            id: Select(["ref", "id"], Var("userDoc")),
            organization: {
              id: Select(["ref", "id"], Var("organizationDoc")),
              maxUsers: Select(["data", "maxUsers"], Var("organizationDoc")),
              name: Select(["data", "name"], Var("organizationDoc")),
              subscriptionLevel: Select(
                ["data", "subscriptionLevel"],
                Var("organizationDoc")
              ),
            },
            role: Select(["data", "role"], Var("userDoc")),
            team: {
              id: Select(["ref", "id"], Var("teamDoc")),
              name: Select(["data", "name"], Var("teamDoc")),
            },
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
        console.log("::: Get Users ERROR :::", error);

        return {
          statusCode: 400,
          body: `Webhook Error: ${error}`,
        };
      });
  } catch (error) {
    console.log(":: ERROR :: [get-management-data] >>> ", error);

    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  }
};
