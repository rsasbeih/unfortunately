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

// Hearts drift up one at a time while rubbing, alternating sides. The gap keeps
// them strictly sequential — the previous heart is gone before the next appears,
// rather than the two swapping over on the same frame.
export const PET_HEART_MS = 2000;
export const PET_HEART_GAP_MS = 250;
// Smaller than the celebration hearts on purpose: petting is the quiet version
export const PET_HEART_SIZE_RATIO = 0.18;   // font size as a fraction of blob width
export const PET_HEART_OFFSET_RATIO = 0.44; // how far from centre each side sits
export const PET_HEART_RISE_EM = 2.6;       // rise in em, so it scales with the heart

export const PET_BLUSH_FADE_MS = 300;      // blush fades in over this
export const PET_EXPRESSION_HOLD_MS = 700; // pleased face lingers this long after rubbing stops
export const PET_LINGER_MS = 900;          // blob stays put this long before wandering again
