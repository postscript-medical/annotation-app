export default function sortIllustrations(illustrations) {
  if (!illustrations || !Array.isArray(illustrations)) return [];

  return illustrations
    .filter(
      (illustration) =>
        illustration &&
        typeof illustration === "object" &&
        illustration.name &&
        typeof illustration.name === "string"
    )
    .sort((el1, el2) => {
      const name1 = el1.name.toLowerCase();
      const name2 = el2.name.toLowerCase();

      if (name1 < name2) return -1;
      if (name1 > name2) return 1;

      return 0;
    });
}
