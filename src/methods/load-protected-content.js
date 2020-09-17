import { protectedContent } from '../stores.js';

export default async function (user) {
  console.log('_loadProtectedContent', user);
  const token = user ? await user.jwt(true) : false;
  console.log('token:', token);
  // TODO: convert these into shared CONSTANTS
  ['individual', 'department', 'organization'].forEach(type => {
    fetch('/.netlify/functions/get-protected-content', {
      method:'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type }),
    })
      .then(response => {
        console.log('................', response)
        return response
      })
      .then(data => {
        console.log('data:', data);
        // protectedContent.set(data.copy);
      })
  });
};