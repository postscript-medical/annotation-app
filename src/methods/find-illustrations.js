export default function findIllustrations(subSpecialties, subSpecialtyName) {
  if (!subSpecialties || !Array.isArray(subSpecialties) || !subSpecialtyName)
    return [];

  const found = subSpecialties.find(
    (subSpecialty) =>
      subSpecialty &&
      typeof subSpecialty === "object" &&
      subSpecialty.name === subSpecialtyName
  );

  return found && found.illustrations ? found.illustrations : [];
}
