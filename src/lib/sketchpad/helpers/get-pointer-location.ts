import type { PointerLocation, SketchEvent } from '../types.ts';

// Ported from legacy `components/sketchpad/helpers/`.
export default function getPointerLocation(
	event: SketchEvent,
	location: PointerLocation,
	hasPointer: boolean
): PointerLocation | undefined {
	if (hasPointer) {
		const pointer = event as PointerEvent;
		if (location.id && location.id !== pointer.pointerId) return;

		location.x = pointer.clientX;
		location.y = pointer.clientY;
		/**
		 * Safari forces us to keep track of the pointer Id as it generates a different number
		 * every time a pointer event starts.
		 * We wipe out this reference when the pointer is removed from the surface
		 */
		location.id = pointer.pointerId;
	} else {
		const touch = (event as TouchEvent).changedTouches[0];
		location.x = touch.clientX;
		location.y = touch.clientY;
	}

	return location;
}
