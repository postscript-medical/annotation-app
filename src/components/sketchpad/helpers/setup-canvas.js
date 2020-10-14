export default function setupCanvas (canvas) {
  const boundingRect = canvas.parentElement.getBoundingClientRect();
  const context = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = boundingRect.width * dpr;
  canvas.height = boundingRect.height * dpr;
  
  context.scale(dpr, dpr);

  return context;
};