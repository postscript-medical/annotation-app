import {
  protectedContent,
  selectedSpecialty,
  selectedSubSpecialty,
  selectedImageTitle,
} from '../stores.js';
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
    .then(data => {
      const defaultImage = data.images.find(image => image.default);
      selectedImageTitle.set((defaultImage || data.images[0]).title);
      selectedSpecialty.set(data.specialties[0]);
      selectedSubSpecialty.set(data.subSpecialties[0]);
      protectedContent.set(data)
    })
};