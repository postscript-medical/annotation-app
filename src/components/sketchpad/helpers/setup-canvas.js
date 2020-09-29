export default function setupCanvas (canvas) {
  const dpr = window.devicePixelRatio || 1;
  const boundingRect = canvas.getBoundingClientRect();
  const context = canvas.getContext('2d');
  
  canvas.width = boundingRect.width * dpr;
  canvas.height = boundingRect.height * dpr;
  
  context.scale(dpr, dpr);

  return context;
};