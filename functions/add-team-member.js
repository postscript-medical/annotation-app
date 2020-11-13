const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { identity } = context.clientContext;
  const { email, firstName, lastName, password, role } = JSON.parse(event.body)

  try {
    const response = await fetch(`${identity.url}/admin/users`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${identity.token}` },
      body: JSON.stringify({
        email,
        password,
        confirm: true,
        app_metadata: {
          roles: [role],
        },
      }),
    })
    .catch(error => {
      return {
        statusCode: 400,
        body: `Error creating user: ${error}`
      };
    });

    if (!response) return {
      statusCode: 400,
      body: 'No user created'
    };

    const createdUser = await response.json();

    console.log('Created user:');
    console.log(JSON.stringify({ createdUser }));

    // Create entry in FaunaDB

    return {
      statusCode: 204,
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  };
};