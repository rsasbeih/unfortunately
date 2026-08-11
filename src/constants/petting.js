/** Tuning constants for the petting interaction (lean, shimmy, pleased expression). */

// Lean is expressed as a fraction of the blob's own rendered width, so a big
// blob leans proportionally further than a small one and the gesture reads the
// same at every size.
export const PET_LEAN_WIDTH_RATIO = 0.14;

// How much of the gap to the target lean the blob closes each frame. Low values
// make it chase the cursor a beat behind, which is what reads as a body being
// pushed rather than a sprite snapping to the pointer.
export const PET_LEAN_DAMPING = 0.2;

export const PET_LEAN_SKEW_DEG = 7;   // top of the body tilts this far at full lean
export const PET_PRESS_SQUASH = 0.04; // scaleY reduction while a pointer is held down

// A pointermove within this window counts as actively rubbing. Stop moving and
// the shimmy and expression decay even while the pointer is still held.
export const PET_MOTION_WINDOW_MS = 150;

export const PET_SHIMMY_MS = 300;        // one side-to-side cycle
// Percentage of the blob's own width, so the shimmy scales with the body for free.
export const PET_SHIMMY_SHIFT_PCT = 2.5;
export const PET_SHIMMY_SQUASH = 0.02;   // slight scaleX wobble riding along with the shift

export const PET_BLUSH_FADE_MS = 300;      // blush + squint fade in over this
export const PET_EXPRESSION_HOLD_MS = 700; // pleased face lingers this long after release
export const PET_LINGER_MS = 900;          // blob stays put this long before wandering again
