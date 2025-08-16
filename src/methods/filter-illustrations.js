export default function filterIllustrations(illustrations, query) {
  if (!illustrations || !Array.isArray(illustrations)) return [];

  return illustrations.filter((illustration) => {
    if (!illustration || typeof illustration !== "object") return false;

    const { name, alias } = illustration;
    if (!name || typeof name !== "string") return false;

    const nameMatch = name.toLowerCase().includes(query.toLowerCase());

    if (alias && Array.isArray(alias)) {
      const aliasMatch = alias.some(
        (entry) =>
          entry &&
          typeof entry === "string" &&
          entry.toLowerCase().includes(query.toLowerCase())
      );
      return nameMatch || aliasMatch;
    }

    return nameMatch;
  });
}
