export default function filterIllustrations(illustrations, query) {
  return illustrations.filter(({ name, alias }) => {
    return (
      name.toLowerCase().includes(query.toLowerCase()) ||
      alias.find((entry) => entry.toLowerCase().includes(query.toLowerCase()))
    );
  });
}
