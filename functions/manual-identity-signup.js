const faunadb = require("faunadb");
const {
  Collection,
  Create,
  Do,
  Get,
  Index,
  Lambda,
  Map,
  Match,
  Paginate,
  Ref,
  Select,
  Update,
  Var,
} = faunadb.query;
const { getEnvironmentKey } = require("./utils/get-environment-key");
const FAUNA_KEY = getEnvironmentKey("FAUNA_SERVER_KEY", process.env);

exports.handler = async (event) => {
  let body;

  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.log("::: ERROR :::", event);

    return {
      statusCode: 400,
      body: `::: ERROR - Invalid JSON - ::: ${error.message}`,
    };
  }

  try {
    const { user, organization = {}, team = {} } = body;
    const { id = null, email = null, firstName = null, lastName = null } = user;
    const {
      maxSpecialties = 1,
      maxUsers = 1,
      name: orgName = "My Organization",
      stripeID = "",
      subscriptionLevel = "inactive",
      specialties = null /* "TODO: Add specialties to the DB" */,
    } = organization;
    const { name: teamName = "My team" } = team;
    const role = "owner";
    const newUserRef = "new-user-" + Date.now();
    const newTeamName = teamName + Date.now();

    const client = new faunadb.Client({
      secret: process.env[FAUNA_KEY],
    });

    const fromFauna = await client
      .query(
        Do(
          /**
           * Create the default team
           */
          Create(Collection("Team"), {
            data: {
              name: newTeamName,
              specialties,
            },
          }),
          /**
           * Create a brand new organization, attaching the default team to it
           */
          Create(Collection("Organization"), {
            data: {
              email,
              maxSpecialties,
              maxUsers,
              name: orgName,
              specialties,
              stripeID,
              subscriptionLevel,
              teams: Paginate(Match(Index("findTeamByName"), newTeamName)),
            },
          }),
          /**
           * Create a new UserAppState with
           * a reference to a temporary user
           */
          Create(Collection("UserAppState"), {
            data: {
              selectedIllustrationTitle: "Graph",
              selectedSpecialty: "Gastroenterology",
              selectedSubSpecialty: "Hepatology",
              userRef: newUserRef,
            },
          }),
          /**
           * Create a new user and attach the
           * previously created UserAppState to it
           */
          Create(Collection("User"), {
            data: {
              appState: Ref(
                Collection("UserAppState"),
                Select(
                  ["ref", "id"],
                  Get(Match("userAppState_userRef_by_user", newUserRef))
                )
              ),
              email,
              firstName,
              lastName,
              netlifyID: id,
              organization: Ref(
                Collection("Organization"),
                Select(
                  ["ref", "id"],
                  Get(Match("findOrganizationByEmail", email))
                )
              ),
              role,
              showTutorial: true,
              team: Ref(
                Collection("Team"),
                Select(
                  ["ref", "id"],
                  Get(Match(Index("findTeamByName"), newTeamName))
                )
              ),
            },
          }),
          /**
           * Update UserAppState with the real user's reference
           */
          Update(
            Ref(
              Collection("UserAppState"),
              Select(
                ["ref", "id"],
                Get(Match("userAppState_userRef_by_user", newUserRef))
              )
            ),
            {
              data: {
                userRef: Ref(
                  Collection("User"),
                  Select(["ref", "id"], Get(Match("findUserByEmail", email)))
                ),
              },
            }
          ),
          /**
           * Update the team's name to remove the timestamp,
           * add a reference to the organization
           */
          Map(
            Paginate(Match(Index("findTeamByName"), newTeamName)),
            Lambda(
              "ref",
              Update(Var("ref"), {
                data: {
                  name: teamName,
                  organization: Ref(
                    Collection("Organization"),
                    Select(
                      ["ref", "id"],
                      Get(Match("findOrganizationByEmail", email))
                    )
                  ),
                },
              })
            )
          )
        )
      )
      .catch((error) => {
        console.log("::: Manual identity signup ERROR :::", error);
        return {
          statusCode: 400,
          body: JSON.stringify({ message: `Fauna idendity signup: ${error}` }),
        };
      });

    if (fromFauna.statusCode && fromFauna.statusCode === 400) {
      return fromFauna;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        app_metadata: {
          roles: [role],
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Identity signup: ${error.message}` }),
    };
  }
};
