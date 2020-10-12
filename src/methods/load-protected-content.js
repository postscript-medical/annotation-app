import { protectedContent } from '../stores.js';

export default async function (user) {
  const token = user ? await user.jwt(true) : false;
  // TODO: convert these into shared CONSTANT
  const subscriptionLevels = ['free', 'individual', 'department', 'organization']
  fetch('/.netlify/functions/get-protected-content', {
    method:'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subscriptionLevels }),
  })
    .then(response => response.json())
    .then(data => protectedContent.set(data.copy))
};