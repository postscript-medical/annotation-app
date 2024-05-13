const faunadb = require("faunadb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createOrganization = require("./methods/create-organization");
const netlifyCreateUser = require("./methods/netlify-create-user");
const netlifyUpdateUserRole = require("./methods/netlify-update-user-role");

exports.handler = async (event, context) => {
  const { identity } = context.clientContext;

  let body;
  let customer;

  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.log("::: [create-invited-account] ERROR :::", event);

    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Invalid JSON body - ${error.message}` }),
    };
  }

  try {
    const { coupon, email, password, product: price } = body;
    const role = "owner";

    customer = await stripe.customers.create({ email });

    await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price }],
      discounts: [{ coupon }],
    });

    if (!identity) throw new Error("No identity token - are you in localhost?");

    const response = await netlifyCreateUser(
      identity.url,
      identity.token,
      email,
      password,
      true
    );

    if (!response) throw new Error("Failed to create user account.");

    console.log("Netlify response:", response);

    const data = await response.json();

    if (`${data.code}`[0] === "4") {
      return {
        statusCode: data.code,
        body: JSON.stringify({ message: data.msg }),
      };
    }

    await netlifyUpdateUserRole(identity.url, identity.token, data.id, role);

    const organization = {
      chosenSpecialty: "all",
      maxUsers: 1,
      name: "My organization",
      subscriptionLevel: "individual",
      specialties: null,
      stripeID: customer.id,
    };
    const team = {
      name: "My team",
    };
    const user = {
      id: data.id,
      email: data.email,
      firstName: null,
      lastName: null,
    };
    const faunaClient = new faunadb.Client({ secret: process.env.FAUNA_KEY });
    const newOrg = await createOrganization({
      faunaClient,
      organization,
      team,
      role,
      user,
    });

    if (newOrg.statusCode && `${newOrg.statusCode}`[0] === 4) return newOrg;

    return { statusCode: 204 };
  } catch (error) {
    console.log("::: [create-invited-account] CATCH :::", error);

    if (customer) await stripe.customers.del(customer.id);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Webhook Error: ${error.message}` }),
    };
  }
};
