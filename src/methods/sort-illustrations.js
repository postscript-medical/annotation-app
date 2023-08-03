export default function sortIllustrations(illustrations) {
  return illustrations.sort((el1, el2) => {
    const name1 = el1.name.toLowerCase();
    const name2 = el2.name.toLowerCase();

    if (name1 < name2) return -1;
    if (name1 > name2) return 1;

    return 0;
  });
}
