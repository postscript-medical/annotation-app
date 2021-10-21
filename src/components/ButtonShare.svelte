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

  function openShareModal() {
    $annotatedImage = generateAnnotatedImage();

    $activeModal = MODAL_SHARE;
  }

  function drawTypedText(context, parentBoundingRect) {
    const entries = Array.from(document.querySelectorAll(".typed-annotation"));
    const fontSize = `${16 * $dpr}px`;

    context.font = `${fontSize} 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif`;
    context.textBaseline = "middle";

    entries.forEach((entry) => {
      const boundingRect = entry.getBoundingClientRect();
      const x =
        (boundingRect.left - parentBoundingRect.left + 7) *
        $dpr; /* 7 is the padding in the input */
      const y =
        (boundingRect.top - parentBoundingRect.top + boundingRect.height / 2) *
        $dpr;

      context.fillStyle = entry.style.color;
      context.fillText(entry.value, x, y);
    });
  }

  function generateAnnotatedImage() {
    const annotatedImage = document.createElement("canvas");
    const context = annotatedImage.getContext("2d");
    const boundingRect = $canvasElement.getBoundingClientRect();
    const illustrationBoudingRect =
      $illustrationDisplayed.getBoundingClientRect();

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
    context.drawImage($canvasElement, 0, 0);

    drawTypedText(context, boundingRect);

    return annotatedImage;
  }
</script>

<PsButton style="tertiary" on:click={openShareModal}>Share</PsButton>
