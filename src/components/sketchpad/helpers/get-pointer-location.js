export default function getPointerLocation (event , hasPointer) {
  const location = { x: 0, y: 0 };
  
  if (hasPointer) {
    location.x = event.clientX;
    location.y = event.clientY;
  } else {
    location.x = event.changedTouches[0].clientX;
    location.y = event.changedTouches[0].clientY;
  }

  return location;
}