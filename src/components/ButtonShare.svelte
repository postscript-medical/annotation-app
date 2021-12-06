<script>
  import {
    activeModal,
    annotatedImage,
    canvasElement,
    dpr,
    illustrationDisplayed,
  } from "../stores.js";
  import { MODAL_SHARE } from "../constants/defaults";
  import PsButton from "./PsButton.svelte";

  function drawTextLine(context, text, x, y) {
    context.fillText(text, x, y);
  }

  function drawTypedText(context, parentBoundingRect) {
    const entries = Array.from(document.querySelectorAll(".typed-annotation"));
    const fontSize = 16 * $dpr;

    context.font = `${fontSize}px 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif`;
    context.textBaseline = "middle";

    entries.forEach((entry) => {
      const boundingRect = entry.getBoundingClientRect();
      const x =
        (boundingRect.left - parentBoundingRect.left + 7) *
        $dpr; /* 7 is the padding in the input in pixels */
      const y = (boundingRect.top - parentBoundingRect.top + 7) * $dpr;

      context.fillStyle = entry.style.color;

      wrapText(context, entry.value, x, y, boundingRect.width * $dpr, fontSize);
    });
  }

  function generateAnnotatedImage() {
    const annotatedImage = document.createElement("canvas");
    const context = annotatedImage.getContext("2d");
    const boundingRect = $canvasElement.getBoundingClientRect();
    const illustrationBoudingRect =
      $illustrationDisplayed.getBoundingClientRect();
    const watermark = document.querySelector(".watermark");

    annotatedImage.width = $canvasElement.width;
    annotatedImage.height = $canvasElement.height;

    context.fillStyle = "white";
    context.fillRect(
      0,
      0,
      boundingRect.width * $dpr,
      boundingRect.height * $dpr
    );
    context.drawImage(
      $illustrationDisplayed,
      (illustrationBoudingRect.left - boundingRect.left) * $dpr,
      (illustrationBoudingRect.top - boundingRect.top) * $dpr,
      illustrationBoudingRect.width * $dpr,
      illustrationBoudingRect.height * $dpr
    );
    context.drawImage(watermark, 16 * $dpr, 16 * $dpr, 85 * $dpr, 71 * $dpr);
    context.drawImage($canvasElement, 0, 0);

    drawTypedText(context, boundingRect);

    return annotatedImage;
  }

  function openShareModal() {
    $annotatedImage = generateAnnotatedImage();

    $activeModal = MODAL_SHARE;
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
</script>

<PsButton
  style="tertiary"
  on:click={openShareModal}
  disabled={!$illustrationDisplayed}>Share</PsButton
>
