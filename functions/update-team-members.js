const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { identity, user } = context.clientContext;
  const userID = user.sub;
  // const usersUrl = `${identity.url}/admin/users`;
  // const adminAuthHeader = `Bearer ${identity.token}`;
  const { email, password } = JSON.parse(event.body)

  // console.log('ADMIN HEADERS:', adminAuthHeader);
  console.log('IDENTITY:', identity);

  try {
    // const response = await fetch(`${identity.url}/admin/users`, {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${identity.token}` },
    //   body: JSON.stringify({ email, password, confirm: true }),
    // })
    // .catch(error => {
    //   return {
    //     statusCode: 400,
    //     body: `Error creating user: ${error}`
    //   };
    // });

    // const response = await fetch(`${identity.url}/admin/users/{${userID}}`, {
    //   method: 'GET',
    //   headers: { Authorization: `Bearer ${identity.token}` },
    // })

    const { identity } = context.clientContext;
    const response = await fetch(`${identity.url}/admin/users/${user.sub}`, {
      method: 'PUT',
      headers: {
        // note that this is a special admin token for the Identity API
        Authorization: `Bearer ${identity.token}`,
      },
      body: JSON.stringify({
        app_metadata: {
          roles: ['owner', 'magician'],
        },
      }),
    });

    if (!response) return {
      statusCode: 400,
      body: 'No user created'
    };

    const data = await response.json();

    console.log('Created user:');
    console.log(JSON.stringify({ data }));

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