const { createClient } = require("@supabase/supabase-js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const supabaseCreateOrganization = require("./methods/supabase-create-organization");
const { supabaseCreateUser } = require("./methods/supabase-create-user");
const {
  supabaseUpdateUserRole,
} = require("./methods/supabase-update-user-role");
const {
  ERROR_CODES,
  createAndLogError,
  createSimpleError,
} = require("./utils/error-handler");

exports.handler = async (event) => {
  let body;
  let customer;

  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return createSimpleError(
      400,
      ERROR_CODES.VALIDATION_INVALID_JSON,
      "Invalid JSON body"
    );
  }

  try {
    const { coupon, email, password, product: price } = body;
    const role = "owner";

    // Validate Supabase environment variables
    if (
      !process.env.SUPABASE_DATABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error(
        "Missing SUPABASE_DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
      );
    }

    customer = await stripe.customers.create({ email });

    await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price }],
      discounts: [{ coupon }],
    });

    // Create user in Supabase Auth
    const createUserResult = await supabaseCreateUser(
      process.env.SUPABASE_DATABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      email,
      password,
      true // confirm email
    );

    if (createUserResult.message) {
      // Error creating user
      return {
        statusCode: 400,
        body: JSON.stringify({ message: createUserResult.message }),
      };
    }

    if (!createUserResult.user || !createUserResult.user.id) {
      throw new Error("Failed to create user account - no user data returned");
    }

    const userId = createUserResult.user.id;
    const userEmail = createUserResult.user.email;

    // Update user role in Supabase Auth
    const updateRoleResult = await supabaseUpdateUserRole(
      process.env.SUPABASE_DATABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      userId,
      role
    );

    if (updateRoleResult.message) {
      // Error updating role - cleanup Stripe customer
      await stripe.customers.del(customer.id);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: updateRoleResult.message }),
      };
    }

    // Create Supabase client for database operations with SERVICE_ROLE_KEY
    const supabaseClient = createClient(
      process.env.SUPABASE_DATABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    const organization = {
      maxUsers: 1,
      name: "My organization",
      subscriptionLevel: "individual",
      stripeID: customer.id,
    };
    const team = {
      name: "My team",
    };
    const user = {
      id: userId,
      email: userEmail,
      firstName: null,
      lastName: null,
    };

    const newOrg = await supabaseCreateOrganization({
      supabaseClient,
      organization,
      team,
      role,
      user,
    });

    if (newOrg.statusCode && `${newOrg.statusCode}`[0] === "4") {
      // Error creating organization - cleanup Stripe customer
      await stripe.customers.del(customer.id);
      return newOrg;
    }

    return { statusCode: 204 };
  } catch (error) {
    // Cleanup Stripe customer on error
    if (customer) {
      try {
        await stripe.customers.del(customer.id);
      } catch (cleanupError) {
        console.error("Error cleaning up Stripe customer:", cleanupError);
      }
    }

    return createAndLogError(
      500,
      ERROR_CODES.SERVER_ERROR,
      "Internal server error",
      error,
      { function: "create-invited-account", email: body?.email }
    );
  }
};
