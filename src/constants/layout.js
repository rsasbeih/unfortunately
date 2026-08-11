/** Layout constants for the responsive / touch-friendly UI. */

// Below this width the UI uses its phone layout.
export const MOBILE_BREAKPOINT_PX = 480;

// Both Apple and Android guidance land near 44px for a comfortable touch target.
export const TOUCH_TARGET_MIN_PX = 44;

// The compose panel caps at this, but always keeps a gap from the screen edge,
// so it can never hang off a narrow phone.
export const PAPER_MAX_WIDTH_PX = 400;
export const PAPER_EDGE_GAP_PX = 16;
export const PAPER_MAX_HEIGHT_PX = 300;

// Celebration hearts scale off the blob, the same way the petting hearts do,
// so they stay in proportion on a small screen.
export const CELEBRATION_HEART_SIZE_RATIO = 0.22;
export const CELEBRATION_HEART_SPREAD_RATIO = 0.5;
