import {
  protectedContent,
  selectedSpecialty,
  selectedSubSpecialty,
  selectedIllustrationTitle,
} from "../stores.js";
import {
  DEFAULT_SELECTED_SPECIALTY,
  DEFAULT_SELECTED_SUB_SPECIALTY,
} from "../constants/defaults";

function find_default_illustration(source) {
  const ALL = "all";

  const all_specialties = source.find(({ name }) => name.toLowerCase() === ALL);

  if (!all_specialties) return "";

  const all_sub_specialties = all_specialties.subSpecialties.find(
    ({ name }) => name.toLowerCase() === ALL
  );

  if (!all_sub_specialties) return "";

  const illustration = all_sub_specialties.illustrations.find(
    ({ default_illustration }) => default_illustration
  );

  if (!illustration) return "";

  return illustration.name;
}

export default async function (user) {
  const token = user ? await user.jwt(true) : false;

  if (!token) return;

  const response = await fetch("/.netlify/functions/get-protected-content", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response || !response.ok) {
    // TODO: clear session storage whenever we hit this error
    throw new Error(
      `An error when fetching protected content:\n${response.status}`
    );
  }

  const data = await response.json();

  /**
   * Netlify identity will return:
   * { copy: 'Not allowed' }
   * whenever if the user requested does not exist.
   */
  if (data.copy) {
    // TODO: show error that no user could be found
    return;
  }

  /**
   *
   */

  const mappedData = {
    ...data,
    team: {
      ...data.team,
      members: data.team.members.data,
      organization: {
        ...data.team.organization,
        specialties: data.team.organization.specialties.data.map(
          (specialty) => {
            return {
              ...specialty,
              subSpecialties: specialty.subSpecialties.data.map(
                (subSpecialty) => {
                  return {
                    ...subSpecialty,
                    illustrations: subSpecialty.illustrations.data,
                  };
                }
              ),
            };
          }
        ),
      },
    },
  };

  const userDefaults = user.user_metadata.illustration || {
    name: find_default_illustration(mappedData.team.organization.specialties),
    specialty: DEFAULT_SELECTED_SPECIALTY,
    subSpecialty: DEFAULT_SELECTED_SUB_SPECIALTY,
  };

  selectedIllustrationTitle.set(userDefaults.name);
  selectedSpecialty.set(userDefaults.specialty);
  selectedSubSpecialty.set(userDefaults.subSpecialty);
  protectedContent.set(mappedData);
}
