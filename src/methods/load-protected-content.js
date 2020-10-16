import {
  protectedContent,
  selectedSpecialty,
  selectedSubSpecialty,
  selectedImageTitle,
} from '../stores.js';
import { SUBSCRIPTION_PLANS } from '../constants/session.js';

export default async function (user) {
  const token = user ? await user.jwt(true) : false;

  if (!token) return;

  fetch('/.netlify/functions/get-protected-content', {
    method:'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ SUBSCRIPTION_PLANS }),
  })
    .then(response => response.json())
    .then(data => {
      /**
       * Netlify identity will return:
       * { copy: 'Not allowed' }
       * whenever if the user requested does not exist.
       */
      if (!data.copy) {
        const defaultImage = data.images.find(image => image.default);
        selectedImageTitle.set((defaultImage || data.images[0]).title);
        selectedSpecialty.set(data.specialties[0]);
        selectedSubSpecialty.set(data.subSpecialties[0]);
      }
      protectedContent.set(data)
    })
    .catch(error => {
      console.error('Error', error);
      // TODO: needs handling
    })
};