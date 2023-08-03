export default function findIllustrations(subSpecialties, subSpecialty) {
  const found = subSpecialties.find(
    ({ name }) => name.toLowerCase() === subSpecialty.toLowerCase()
  );

  return found.illustrations || [];
}
