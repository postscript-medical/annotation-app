import { get } from "svelte/store";
import { canvasElement, dpr, selectedIllustration } from "../stores.js";

function drawTextLine(context, text, x, y) {
  context.fillText(text, x, y);
}

function drawTypedText(context, parentBoundingRect, dpr) {
  const entries = Array.from(document.querySelectorAll(".typed-annotation"));
  const fontSize = 16 * dpr;

  context.font = `${fontSize}px 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif`;
  context.textBaseline = "middle";

  entries.forEach((entry) => {
    // Skip if entry is null or doesn't exist
    if (!entry || !entry.getBoundingClientRect) {
      return;
    }

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
  const words = text.split(" ");
  const newLines = words.flatMap((word) => word.split(/([\r\n])/));
  let line = "";
  let _y = y;

  for (let index = 0; index < newLines.length; index++) {
    const testLine = line + newLines[index] + " ";
    const measure = context.measureText(testLine);
    const isNewLine = newLines[index] === "\n" || newLines[index] === "\r";

    if (measure.width > maxWidth || isNewLine) {
      drawTextLine(context, line, x, _y);
      line = isNewLine ? newLines[index] + " " : "";
      _y += lineHeight;
    } else {
      line = testLine;
    }
  }

  drawTextLine(context, line, x, _y);
}

export default async function generateAnnotatedImage() {
  try {
    const srcCanvas = get(canvasElement);
    const currentIllustration = get(selectedIllustration);
    const _dpr = get(dpr);

    if (!currentIllustration || !currentIllustration.src) {
      throw new Error(
        "No illustration selected or illustration source is missing"
      );
    }

    const annotatedImage = document.createElement("canvas");
    const context = annotatedImage.getContext("2d");
    const canvasBoundingRect = srcCanvas.getBoundingClientRect();

    // Fetch the illustration image and create an ImageBitmap
    const imageUrl =
      "/images/annotation-app/illustrations/" + currentIllustration.src;

    let illustrationImage;
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(
          `Image not accessible: ${response.status} ${response.statusText}`
        );
      }
      const imageBlob = await response.blob();
      illustrationImage = await createImageBitmap(imageBlob);
    } catch (fetchError) {
      console.error("Failed to fetch image:", fetchError);
      throw fetchError;
    }

    // Load watermark
    const imageBlob = await fetchBlob(
      "/images/annotation-app/postscript-logo-raster.png"
    );
    const watermark = await createImageBitmap(imageBlob);

    annotatedImage.width = srcCanvas.width;
    annotatedImage.height = srcCanvas.height;

    context.fillStyle = "white";
    context.fillRect(
      0,
      0,
      canvasBoundingRect.width * _dpr,
      canvasBoundingRect.height * _dpr
    );

    // Draw the illustration centered on the canvas
    const imgWidth = illustrationImage.width * _dpr;
    const imgHeight = illustrationImage.height * _dpr;
    const x = (srcCanvas.width - imgWidth) / 2;
    const y = (srcCanvas.height - imgHeight) / 2;

    context.drawImage(illustrationImage, x, y, imgWidth, imgHeight);
    context.drawImage(watermark, 16 * _dpr, 16 * _dpr, 85 * _dpr, 71 * _dpr);
    context.drawImage(srcCanvas, 0, 0);

    drawTypedText(context, canvasBoundingRect, _dpr);

    return annotatedImage;
  } catch (error) {
    console.error("Error generating annotated image:", error);
    throw error;
  }
}
