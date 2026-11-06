// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.9).
// Ported as-is (2.1) from legacy `methods/clone.js`.
export default function clone(source) {
	return JSON.parse(JSON.stringify(source));
}
