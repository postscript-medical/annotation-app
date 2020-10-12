import { protectedContent } from '../stores.js';
import { SUBSCRIPTION_PLANS } from '../constants/session.js';

export default async function (user) {
  const token = user ? await user.jwt(true) : false;

  fetch('/.netlify/functions/get-protected-content', {
    method:'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ SUBSCRIPTION_PLANS }),
  })
    .then(response => response.json())
    .then(data => protectedContent.set(data.copy))
};