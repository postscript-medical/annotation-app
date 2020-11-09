import {
  protectedContent,
  selectedSpecialty,
  selectedSubSpecialty,
  selectedIllustrationTitle,
} from '../stores.js';
import {
  DEFAULT_SELECTED_SPECIALTY,
  DEFAULT_SELECTED_SUB_SPECIALTY
} from '../constants/defaults';

export default async function (user) {
  const token = user ? await user.jwt(true) : false;

  if (!token) return;

  const response = await fetch('/.netlify/functions/get-protected-content', {
    method:'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error (`An error when fetching protected content:\n${reponse.status}`)
  };

  const data = await response.json();

  if(data.copy) {
    // TODO: show error that no user could be found
    return;
  }

  const mappedData = {
    ...data,
    ...data.team,
    organization: {
      ...data.team.organization,
      specialties: data.team.organization.specialties.data.map(specialty => {
        return {
          ...specialty,
          subSpecialties: specialty.subSpecialties.data.map(subSpecialty => {
            return {
              ...subSpecialty,
              illustrations: subSpecialty.illustrations.data
            }
          })
        }
      })
    }
  }

  const userDefaults = user.user_metadata.illustration || {
    name: mappedData.specialties[0].subSpecialties[0].illustrations[0].name,
    specialty: DEFAULT_SELECTED_SPECIALTY,
    subSpecialty: DEFAULT_SELECTED_SUB_SPECIALTY,
  };

  selectedIllustrationTitle.set(userDefaults.name);
  selectedSpecialty.set(userDefaults.specialty);
  selectedSubSpecialty.set(userDefaults.subSpecialty);
  protectedContent.set(mappedData)


    // .then(response => response.json())
    // .then(data => {
    //   /**
    //    * Netlify identity will return:
    //    * { copy: 'Not allowed' }
    //    * whenever if the user requested does not exist.
    //    */
    //   if (data.copy) {
    //     // TODO: show error
    //     return;
    //   }
    //   const mappedData = {
    //     ...data,
    //     team: {
    //       ...data.team,
    //       organization: {
    //         ...data.team.organization,
    //         specialties: data.team.organization.specialties.data.map(specialty => {
    //           return {
    //             ...specialty,
    //             subSpecialties: specialty.subSpecialties.data.map(subSpecialty => {
    //               return {
    //                 ...subSpecialty,
    //                 illustrations: subSpecialty.illustrations.data
    //               }
    //             })
    //           }
    //         })
    //       }
    //     }
    //   };

    //   const userDefaults = user.user_metadata.illustration || {
    //     name: mappedData.specialties[0].subSpecialties[0].illustrations[0].name,
    //     specialty: DEFAULT_SELECTED_SPECIALTY,
    //     subSpecialty: DEFAULT_SELECTED_SUB_SPECIALTY,
    //   };

    //   selectedIllustrationTitle.set(userDefaults.name);
    //   selectedSpecialty.set(userDefaults.specialty);
    //   selectedSubSpecialty.set(userDefaults.subSpecialty);
    //   protectedContent.set(mappedData)
    // })
    // .catch(error => {
    //   console.error('Error', error);
    //   // TODO: needs handling
    // })
};