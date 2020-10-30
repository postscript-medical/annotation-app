export default function getPointerLocation (event, location, hasPointer) {  
  if (hasPointer) {
    if (location.id && (location.id !== event.pointerId)) return;

    location.x = event.clientX;
    location.y = event.clientY;
    /**
     * Safari forces us to keep track of the pointer Id as it generates a different number
     * every time a pointer event starts.
     * We wipe out this reference when the pointer is removed from the surface
     */
    location.id = event.pointerId
  } else {
    location.x = event.changedTouches[0].clientX;
    location.y = event.changedTouches[0].clientY;
  }

  return location;
}