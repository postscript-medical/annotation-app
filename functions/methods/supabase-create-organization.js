const { randomUUID } = require("crypto");

/**
 * Creates an organization, team, user, and user_app_state in Supabase
 * This is the Supabase migration of the FaunaDB create-organization.js method
 *
 * @param {Object} params
 * @param {Object} params.supabaseClient - Supabase client instance (with anon key)
 * @param {Object} params.organization - Organization data
 * @param {string} params.organization.name - Organization name
 * @param {string} params.organization.email - Organization email
 * @param {string} params.organization.stripeID - Stripe customer ID
 * @param {number} params.organization.maxUsers - Maximum users allowed
 * @param {string} params.organization.subscriptionLevel - Subscription level
 * @param {Object} params.team - Team data
 * @param {string} params.team.name - Team name
 * @param {string} params.role - User role ("owner", "admin", "user", "dm")
 * @param {Object} params.user - User data
 * @param {string} params.user.id - Supabase Auth user ID (for auth_id field)
 * @param {string} params.user.email - User email
 * @param {string} params.user.firstName - User first name (optional)
 * @param {string} params.user.lastName - User last name (optional)
 * @returns {Promise<Object>} Success response or error object with statusCode
 */
module.exports = async function supabaseCreateOrganization({
  supabaseClient,
  organization,
  team,
  role,
  user,
}) {
  const { id: authId, email, firstName = null, lastName = null } = user;

  const {
    maxUsers = 1,
    name: orgName = "My Organization",
    subscriptionLevel = "inactive",
    stripeID = null,
  } = organization;

  const { name: teamName = "My team" } = team;

  // Generate UUIDs for original_source_id fields (required for migration compatibility)
  const orgSourceId = randomUUID();
  const teamSourceId = randomUUID();
  const userSourceId = randomUUID();
  const appStateSourceId = randomUUID();

  try {
    // Step 1: Create organization first (no dependencies)
    const { data: orgData, error: orgError } = await supabaseClient
      .from("organizations")
      .insert({
        original_source_id: orgSourceId,
        name: orgName,
        email: email,
        stripe_id: stripeID,
        max_users: maxUsers,
        subscription_level: subscriptionLevel,
        available_specialties: "all", // Default for new organizations
      })
      .select()
      .single();

    if (orgError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error creating organization: ${orgError.message}`,
        }),
      };
    }

    // Step 2: Create team with organization_id (organization_id is NOT NULL, so must create org first)
    const { data: teamData, error: teamError } = await supabaseClient
      .from("teams")
      .insert({
        original_source_id: teamSourceId,
        name: teamName,
        organization_id: orgData.id, // Required NOT NULL field
      })
      .select()
      .single();

    if (teamError) {
      // Cleanup: delete organization if team creation fails
      await supabaseClient.from("organizations").delete().eq("id", orgData.id);
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error creating team: ${teamError.message}`,
        }),
      };
    }

    // Step 3: Create user
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .insert({
        original_source_id: userSourceId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: role,
        auth_id: authId, // Supabase Auth user ID
        team_id: teamData.id,
        show_tutorial: true,
      })
      .select()
      .single();

    if (userError) {
      // Cleanup: delete team and org (in reverse order due to FK constraints)
      await supabaseClient.from("teams").delete().eq("id", teamData.id);
      await supabaseClient.from("organizations").delete().eq("id", orgData.id);
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error creating user: ${userError.message}`,
        }),
      };
    }

    // Step 4: Create user_app_state
    const { data: appStateData, error: appStateError } = await supabaseClient
      .from("user_app_states")
      .insert({
        original_source_id: appStateSourceId,
        user_id: userData.id,
        selected_specialty_id: null,
        selected_sub_specialty_id: null,
        selected_illustration_id: null,
      })
      .select()
      .single();

    if (appStateError) {
      // Cleanup: delete user, team, and org (in reverse order due to FK constraints)
      await supabaseClient.from("users").delete().eq("id", userData.id);
      await supabaseClient.from("teams").delete().eq("id", teamData.id);
      await supabaseClient.from("organizations").delete().eq("id", orgData.id);
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error creating user_app_state: ${appStateError.message}`,
        }),
      };
    }

    // Success - return the created organization data
    return {
      organization: orgData,
      team: teamData,
      user: userData,
      appState: appStateData,
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Unexpected error: ${error.message}` }),
    };
  }
};
