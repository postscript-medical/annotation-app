import filterIllustrations from "./filter-illustrations";
import sortIllustrations from "./sort-illustrations";

export default function filterSortIllustrations(illustrations, query) {
  const filtered = query
    ? filterIllustrations(illustrations, query)
    : illustrations;

  return sortIllustrations(filtered);
}
