const content = {
  individual: {
    copy: 'Individual level',
    allowedRoles: ['individual'],
  },
  department: {
    copy: 'Department level',
    allowedRoles: ['department'],
  },
  organization: {
    copy: 'Organization level',
    allowedRoles: ['organization'],
  }
};

exports.handler = async (event, context) => {
  console.log('>>>>>>>>>>>>>>>>>>>getProtectedContent:', event.body);
  const { type } = JSON.parse(event.body);
  const { user } = context.clientContext;
  const roles = user ? user.app_metadata.roles : false;
  const { allowedRoles } = content[type];

  console.log('context:', content);
  console.log('type:', type);
  console.log('user', user);
  console.log('roles:', roles);
  console.log('allowedRoles:', allowedRoles);

  if (!roles || !roles.some(role => allowedRoles.include(role))) {
    return {
      statusCode: 402,
      body: JSON.stringify({
        copy: 'Not allowed.'
      })
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(content[type]),
  };
};