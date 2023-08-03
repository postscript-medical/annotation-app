const postmark = require("postmark");
const faunadb = require("faunadb");
const {
  Collection,
  Create,
  Do,
  Exists,
  Get,
  If,
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
const emailClient = new postmark.ServerClient(process.env.POSTMARK_TOKEN);

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
      chosenSpecialty = "",
      maxUsers = 1,
      name: orgName = "My Organization",
      subscriptionLevel = "inactive",
      specialties = null,
      stripeID = "",
    } = organization;
    const { name: teamName = "My team" } = team;
    const role = "owner";
    const newUserRef = "new-user-" + Date.now();
    const tempTeamName = teamName + Date.now();
    const client = new faunadb.Client({
      secret: process.env.FAUNA_KEY,
    });

    const existingUser = await client.query(
      If(
        Exists(Match(Index("findUserByEmail"), email)),
        Get(Match(Index("findUserByEmail"), email)),
        false
      )
    );

    console.log(">>>> Existing user:", existingUser);
    /**
     * If the use already exists all we need to do is update
     * their invitationStatus to "Confirmed"
     */
    if (existingUser) {
      await client.query(
        Update(
          Ref(
            Collection("User"),
            Select(["ref", "id"], Get(Match(Index("findUserByEmail"), email)))
          ),
          {
            data: {
              invitationStatus: "Confirmed",
            },
          }
        )
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          app_metadata: {
            roles: ["team-member"],
          },
        }),
      };
    }

    const fromFauna = await client
      .query(
        Do(
          /**
           * Create the default team
           */
          Create(Collection("Team"), {
            data: {
              name: tempTeamName,
            },
          }),
          /**
           * Create a brand new organization, attaching the default team to it
           */
          Create(Collection("Organization"), {
            data: {
              chosenSpecialty,
              email,
              maxUsers,
              name: orgName,
              specialties,
              stripeID,
              subscriptionLevel,
              teams: Paginate(Match(Index("findTeamByName"), tempTeamName)),
            },
          }),
          /**
           * Create a new UserAppState with
           * a reference to a temporary user
           */
          Create(Collection("UserAppState"), {
            data: {
              selectedIllustrationTitle: "",
              selectedSpecialty: "",
              selectedSubSpecialty: "",
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
              invitationStatus: "Confirmed",
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
                  Get(Match(Index("findTeamByName"), tempTeamName))
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
            Paginate(Match(Index("findTeamByName"), tempTeamName)),
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

    await emailClient.sendEmail({
      From: "accounts@postscriptmedical.com",
      To: "accounts@postscriptmedical.com",
      Subject: "[POSTSCRIPT] New user signup",
      HtmlBody: `Heads up new user: ${email}`,
      MessageStream: "netlify-identity",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        app_metadata: {
          roles: [role],
        },
      }),
    };
  } catch (error) {
    console.log("::: IDENTITY SIGNUP CATCH :::", error);

    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Identity signup: ${error.message}` }),
    };
  }
};
