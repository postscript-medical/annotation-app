// @ts-nocheck -- legacy JavaScript ported as-is (2.1); typed in the runes conversion (2.8).
// Ported as-is (2.1) from legacy `methods/generate-annotated-image.js`: flattens the illustration,
// the watermark, the canvas strokes and the typed text into one canvas for sharing (2.5).
import { get } from 'svelte/store';
import { WATERMARK_URL } from '../images.ts';
import { canvasElement, dpr, illustrationDisplayed } from './stores.js';

function drawTextLine(context, text, x, y) {
	context.fillText(text, x, y);
}

function drawTypedText(context, parentBoundingRect, dpr) {
	const entries = Array.from(document.querySelectorAll('.typed-annotation'));
	const fontSize = 16 * dpr;

	context.font = `${fontSize}px 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif`;
	context.textBaseline = 'middle';

	entries.forEach((entry) => {
		const boundingRect = entry.getBoundingClientRect();
		const x =
			(boundingRect.left - parentBoundingRect.left + 7) *
			dpr; /* 7 is the padding in the input in pixels */
		const y = (boundingRect.top - parentBoundingRect.top + 7) * dpr;

		context.fillStyle = entry.style.color;

		wrapText(context, entry.value, x, y, boundingRect.width * dpr, fontSize);
	});
}

async function fetchBlob(url) {
	const response = await fetch(url);
	const blob = await response.blob(); // TODO: Check for errors

	return blob;
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
	const words = text.split(' ');
	const newLines = words.flatMap((word) => word.split(/([\r\n])/));
	let line = '';
	let _y = y;

	for (let index = 0; index < newLines.length; index++) {
		const testLine = line + newLines[index] + ' ';
		const measure = context.measureText(testLine);
		const isNewLine = newLines[index] === '\n' || newLines[index] === '\r';

		if (measure.width > maxWidth || isNewLine) {
			drawTextLine(context, line, x, _y);
			line = isNewLine ? newLines[index] + ' ' : '';
			_y += lineHeight;
		} else {
			line = testLine;
		}
	}

	drawTextLine(context, line, x, _y);
}

export default async function generateAnnotatedImage() {
	const srcCanvas = get(canvasElement);
	const srcIllustration = get(illustrationDisplayed);
	const _dpr = get(dpr);
	const annotatedImage = document.createElement('canvas');
	const context = annotatedImage.getContext('2d');
	const canvasBoundingRect = srcCanvas.getBoundingClientRect();
	const illustrationBoundingRect = srcIllustration.getBoundingClientRect();
	const imageBlob = await fetchBlob(WATERMARK_URL);
	const watermark = await createImageBitmap(imageBlob);

	annotatedImage.width = srcCanvas.width;
	annotatedImage.height = srcCanvas.height;

	context.fillStyle = 'white';
	context.fillRect(0, 0, canvasBoundingRect.width * _dpr, canvasBoundingRect.height * _dpr);
	context.drawImage(
		srcIllustration,
		(illustrationBoundingRect.left - canvasBoundingRect.left) * _dpr,
		(illustrationBoundingRect.top - canvasBoundingRect.top) * _dpr,
		illustrationBoundingRect.width * _dpr,
		illustrationBoundingRect.height * _dpr
	);
	context.drawImage(watermark, 16 * _dpr, 16 * _dpr, 85 * _dpr, 71 * _dpr);
	context.drawImage(srcCanvas, 0, 0);

	drawTypedText(context, canvasBoundingRect, _dpr);

	return annotatedImage;
}
