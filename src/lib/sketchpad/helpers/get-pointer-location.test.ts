import { describe, expect, it } from 'vitest';
import getPointerLocation from './get-pointer-location.js';

describe('getPointerLocation', () => {
	describe('pointer events', () => {
		it('records the client position and the pointer id', () => {
			const location = { x: 0, y: 0 };
			const event = { clientX: 10, clientY: 20, pointerId: 7 };

			expect(getPointerLocation(event, location, true)).toEqual({ x: 10, y: 20, id: 7 });
		});

		it('follows the same pointer while it stays down', () => {
			const location = { x: 10, y: 20, id: 7 };
			const event = { clientX: 15, clientY: 25, pointerId: 7 };

			expect(getPointerLocation(event, location, true)).toEqual({ x: 15, y: 25, id: 7 });
		});

		it('ignores a second pointer (returns undefined, location unchanged)', () => {
			const location = { x: 10, y: 20, id: 7 };
			const event = { clientX: 99, clientY: 99, pointerId: 8 };

			expect(getPointerLocation(event, location, true)).toBeUndefined();
			expect(location).toEqual({ x: 10, y: 20, id: 7 });
		});

		it('accepts a new pointer once the id has been reset', () => {
			const location = { x: 10, y: 20, id: undefined };
			const event = { clientX: 30, clientY: 40, pointerId: 8 };

			expect(getPointerLocation(event, location, true)).toEqual({ x: 30, y: 40, id: 8 });
		});
	});

	describe('touch events (no PointerEvent)', () => {
		it('uses the first changed touch and keeps no id', () => {
			const location = { x: 0, y: 0 };
			const event = {
				changedTouches: [
					{ clientX: 5, clientY: 6 },
					{ clientX: 50, clientY: 60 }
				]
			};

			expect(getPointerLocation(event, location, false)).toEqual({ x: 5, y: 6 });
		});
	});
});
