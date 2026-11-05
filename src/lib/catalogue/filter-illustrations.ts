import type { Illustration } from './types';

/**
 * The illustrations whose name or an alias contains `query`, ignoring case and surrounding
 * spaces; all of them for an empty query. Keeps the order it's given.
 *
 * Ported from legacy `methods/filter-sort-illustrations.js` (with `filter-illustrations.js` and
 * `sort-illustrations.js`). Legacy also sorted by name because its catalogue came unordered; the
 * catalogue repo now orders by `ordering`, then name, and sorting again here would undo that.
 */
export function filterIllustrations(
	illustrations: readonly Illustration[],
	query: string | null | undefined
): Illustration[] {
	const needle = query?.trim().toLocaleLowerCase('en') ?? '';
	if (!needle) return [...illustrations];

	const matches = (text: string) => text.toLocaleLowerCase('en').includes(needle);
	return illustrations.filter(({ name, alias }) => matches(name) || alias.some(matches));
}
