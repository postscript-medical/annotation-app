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

module.exports = function createOrganization({
  faunaClient,
  organization,
  team,
  role,
  user,
}) {
  const {
    id,
    email,
    firstName,
    lastName,
    invitationStatus = "Confirmed",
  } = user;
  const {
    chosenSpecialty = "",
    maxUsers = 1,
    name: orgName = "My Organization",
    subscriptionLevel = "inactive",
    specialties = null,
    stripeID = null,
  } = organization;
  const { name: teamName = "My team" } = team;
  const newUserRef = "new-user-" + Date.now();
  const tempTeamName = teamName + Date.now();

  return faunaClient
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
            invitationStatus,
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
};
