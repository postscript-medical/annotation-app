// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.9).
// Ported as-is (2.1) from legacy `components/sketchpad/helpers/`.
import { get } from 'svelte/store';
import { dpr } from '../stores.js';

export default function setupCanvas(canvas) {
	const boundingRect = canvas.parentElement.getBoundingClientRect();
	const context = canvas.getContext('2d');
	const pixelRatio = get(dpr);

	canvas.width = boundingRect.width * pixelRatio;
	canvas.height = boundingRect.height * pixelRatio;

	context.scale(pixelRatio, pixelRatio);

	return context;
}
