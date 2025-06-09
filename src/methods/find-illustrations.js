export default function findIllustrations(subSpecialties, subSpecialtyId) {
  const found = subSpecialties.find(({ id }) => id === subSpecialtyId);

  return found.illustrations || [];
}
