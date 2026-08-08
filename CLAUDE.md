# unfortunately

A React + Vite app featuring an animated blob monster built entirely in SVG.

## What we've built so far

### Monster shape
- Single `<path>` with cubic bezier curves — not ellipses — so the silhouette is one continuous smooth shape with no seams
- The path is deliberately squatter (wider than tall) to match a jello/slime reference
- Path: `M 100,25 C 148,22 192,62 194,108 C 196,148 168,178 100,180 C 32,178 4,148 6,108 C 8,62 52,22 100,25 Z`
- Two-layer gloss highlight in the upper-left (large soft halo + tight bright core)
- Gloss is hue-tinted (pale version of the blob's own color), NOT white — white looked like a sticker
- `clipPath="url(#bodyClip)"` on all blur layers (glow + gloss) so blurs fade at the body edge and never bleed outside the silhouette
- Subtle belly glow at the base (hue shifted +20° for a natural "light from below" feel)
- Drop shadow ellipse below the body

### Colors
- All body colors derived from a single `hue` (0–359) via HSL — light/mid/dark stops + glow + gloss all computed from it
- **Persisted in `localStorage` as `monsterHue`**: random on first visit, same color every reload after that
- Eventually: each visitor gets their own color that stays with them

### Size
- Controlled by a `size` multiplier (default `1.0`, meaning 200×200px SVG)
- Applied as `width={200 * size} height={200 * size}` — `viewBox` stays `0 0 200 200` so all coordinates are stable
- **Persisted in `localStorage` as `monsterSize`** — minimum valid size 1.0 (ignores stale values from old era)
- Grows by +0.04 each time the monster eats (no cap — grows infinitely)

### Animation
- CSS `@keyframes squish` in `Monster.css`: gentle scaleX/scaleY pulse, 1.7s loop
- `transform-box: fill-box` + `transform-origin: center bottom` so the squish anchors to the feet

### Feeding Mechanic
- **Ball throwing**: Drag to aim, release to throw. Ball bounces across the entire screen with physics-based gravity fade over bounces.
- **Ball physics** (`ProjectileBall.jsx`):
  - Gravity fades from 0.5 px/frame² to 0 over 4 bounces (organic settling anywhere on screen)
  - Friction tightens from 0.99 to 0.97 as gravity fades (smoother coast to stop)
  - Coefficient of restitution (COR) = 0.65 on all surfaces (walls, ceiling, floor)
  - Lands when speed drops below 0.4 px/frame (physics sleep, not hard floor threshold)
  - Brief squash animation on bounce impact (65ms squash, 95ms return to normal) — "juice" per GDC research
  - De-spins over 350ms before handing off to eating animation (prevents visual pop)
- **Monster hopping** (`MonsterHop.jsx`):
  - Wanders randomly (`STEP=90px` hops) while in "landing" phase
  - Pursues food target when it lands, arrival threshold = 180px to handle edge-clamped cases at size=1.0
  - Triggers eating when arriving at food
- **Eating animation** (`EatAnimation.jsx`):
  - Ball travels to monster center over 280ms (ease-in quad)
  - 5 suction particles drift inward during travel (visual anticipation)
  - White radial flash at absorption moment (90ms)
  - 16 particles burst outward (150ms, ease-out quad) then converge back inward (420ms, ease-in cubic, shrinking + fading)
  - Canvas overlay for particle effects (avoids per-element DOM overhead)
  - Total duration ~800ms, monster grows by 0.04 size on completion (no cap)

## Recent Changes

### Session: Codebase Cleanup (Lead + 8 Subagents)
**What was done**: Comprehensive code quality audit and cleanup via multi-agent workflow.

**Issues Fixed**:
1. **Magic size constant** — Extracted `SVG_BASE_SIZE = 200` to `src/constants/sizes.js`. Imported in MonsterHop, FeedingMechanic, ProjectileBall, CrumpledBall.
2. **Dead code** — Deleted `ProjectileBall.backup.jsx` and `FeedingMechanic.backup.jsx`.
3. **eatPhase enum** — Created `src/constants/eatPhases.js` with NONE, GULP, SHIMMY. Updated MonsterHop.jsx to use it.
4. **CreaseLines component** — New `src/feeding/CreaseLines.jsx` component replaces 4 duplicate SVG line blocks. Used in ProjectileBall, CrumpledBall, EatAnimation, FeedingMechanic.
5. **Animation timing constants** — Added comments documenting easing factors (0.22 launch, 0.65 bounce, 0.9 friction) with purpose in CrumpledBall and EatAnimation.
6. **Unused import** — Removed `useState` from ProjectileBall.jsx (never used).
7. **Rendering pattern** — Refactored FeedingMechanic.jsx conditional logic for consistency.
8. **Color constants** — Created `src/constants/colors.js` with BALL_LIGHT, BALL_MEDIUM, BALL_CREASE, PAPER_LIGHT, etc. Replaced inline colors across components.

**Testing**: QA passed — full eating flow works, all animations intact.

### Quick Fix: Monster Eyes
**Change**: Eyes now pure black (#000) instead of hue-derived gray. Eyes stay black regardless of monster color.

### Feature: Celebration Animation
**What was added**: After the monster finishes eating:
1. **Joy jumps** — Monster does 3 celebration jumps (700ms spacing) while staying in place
2. **Smiling expression** — Mouth curves up during celebration, then returns to neutral
3. **Heart bursts** — 3 hearts burst upward with each jump (12 total: initial burst + 3 jumps × 3 hearts each)
   - Hearts arranged radially around monster center
   - Each heart has slight random offset
   - Staggered 80ms delays per heart for cascading effect
   - Fly upward 120px and fade out over 1.5s
4. **Timing**: Celebration lasts ~3.5s total, then monster resumes normal idle wandering

**Implementation**: 
- `App.jsx`: New state `celebrationBurst` tracks which burst we're on (0-4). Increments at 0ms, 700ms, 1400ms, 2100ms.
- `MonsterHop.jsx`: New effect watches `isCelebrating` prop, triggers smile + 3-jump sequence, clears afterward.
- Hearts render based on `celebrationBurst` value. Each burst shows 3 hearts with `heartBurst` animation (upward + fade).

### Session: Enum Refactor + Bug Fixes
**What was done**:
1. Created `src/constants/paperPhase.js` enum with all phase constants (IDLE, COMPOSING, HOLDING, THROWING, LANDED, BEING_EATEN)
2. Updated all phase strings throughout codebase to use enum constants
3. Fixed critical bugs that broke eating mechanic

**Bugs fixed**:
- **FeedingMechanic.jsx line 73**: Was checking `PaperPhase.HOLDING` for ProjectileBall render (wrong — should be THROWING). Ball never rendered because condition was incorrect.
- **App.jsx line 18**: `handleFoodLanded` was setting phase to `IDLE` instead of `LANDED`. This skipped the ball-resting-on-screen state entirely.
- **App.jsx line 7**: Initial state was hardcoded string `"idle"` instead of `PaperPhase.IDLE`.

**Testing**: Full flow verified with QA screenshots — ball bounces, settles, monster approaches, eating animation plays with particles, monster grows, returns to idle.

## Recent Changes (Earlier)

### Session: Ball Physics Regression & Hop Fixes
**Issue**: After implementing eating animation, the ball was bouncing too energetically and settling too slowly. Monster hop was getting stuck on certain screen positions and appeared "too fast" after size changed to 1.0.

**Fixes**:
1. **ProjectileBall.jsx**: Reverted physics constants to baseline (COR=0.65, gravity fade 0.5→0, 4-bounce fade cycle, sleep speed 0.4). Kept squash animation from research (highest "juice" impact per GDC). This eliminated oscillation at walls and settled the ball cleanly within 4–5 seconds.
2. **MonsterHop.jsx**: Increased food arrival threshold from `STEP*1.5` (135px) to `STEP*2.0` (180px). At size=1.0, the monster's center is clamped 150px from screen edges; food at a corner could be 144px away, causing infinite hop loop. Threshold increase covers worst-case geometry.

**Files modified**:
- `src/feeding/ProjectileBall.jsx` — simplified physics, removed 20-frame sleep counter
- `src/MonsterHop.jsx` — arrival distance increased for food targeting
- Backup files removed (no longer needed after validation)

### Session: Feeding Mechanic + Eating Animation
**What was added**:
1. **Ball throwing**: Paper ball crumpling, drag-to-aim, release-to-throw. Ball bounces anywhere on screen.
2. **New eating animation** (`EatAnimation.jsx`): Canvas overlay with ball travel → white flash → particle burst/converge (satisfying visual feedback).
3. **Size growth**: Monster grows +0.04 size per eaten ball, persisted to localStorage, capped at 2.0.
4. **Monster pathfinding**: Pursues ball, eats it on arrival, returns to idle.

### Session: Size Persistence & Bug Fixes
**Changes**:
- localStorage key standardized to `monsterSize` (was `monsterSizeV2`)
- Default changed from 0.5 → 1.0
- Added minimum-value guard (≥1.0) to ignore stale values from old era
- Ball visual snap on landing: fixed by CSS-transitioning rotation to 0deg + filter removal before React swap

## Planned / not yet done
- Mouth / expressions
- Code cleanup / refactoring (noted as needed)
