import { protectedContent } from '../stores.js';

export default function (user) {
  console.log('_loadProtectedContent', user);
  const token = user ? user.jwt(true) : false;
  // TODO: convert these into shared CONSTANTS
  ['individual', 'department', 'organization'].forEach(type => {
    fetch('/.netlify/functions/get-protected-content', {
      method:'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('data:', data);
        protectedContent.set(data.copy);
      })
  });
};