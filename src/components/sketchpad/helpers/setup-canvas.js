import { get } from "svelte/store";
import { dpr } from "../../../stores";

export default function setupCanvas(canvas) {
  const boundingRect = canvas.parentElement.getBoundingClientRect();
  const context = canvas.getContext("2d");
  const pixelRatio = get(dpr);

  canvas.width = boundingRect.width * pixelRatio;
  canvas.height = boundingRect.height * pixelRatio;

  context.scale(pixelRatio, pixelRatio);

  return context;
}
