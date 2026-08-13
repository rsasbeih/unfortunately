# unfortunately

A React + Vite app featuring an animated blob monster built entirely in SVG.

## What we've built so far

### Monster shape
- Single `<path>` with cubic bezier curves — not ellipses — so the silhouette is one continuous smooth shape with no seams
- The path is deliberately squatter (wider than tall) to match a jello/slime reference
- Path: `M 100,25 C 148,22 192,62 194,108 C 196,148 168,178 100,180 C 32,178 4,148 6,108 C 8,62 52,22 100,25 Z`
- Two-layer gloss highlight in the upper-left (large soft halo + tight bright core)
- Gloss is hue-tinted (pale version of the blob's own color), NOT white — white looked like a sticker
- `clipPath="url(#mhC)"` on all blur layers (glow + gloss) so blurs fade at the body edge and never bleed outside the silhouette
- Subtle belly glow at the base (hue shifted +20° for a natural "light from below" feel)
- Drop shadow ellipse below the body

### Colors
- All body colors derived from a single `hue` (0–359) via HSL — light/mid/dark stops + glow + gloss all computed from it
- **Persisted in `localStorage` as `monsterHue`**: random on first visit, same color every reload after that
- Eventually: each visitor gets their own color that stays with them

### Color Picker (`ColorPicker.jsx`)
- Gear button fixed at top-right; click (or Enter/Space) toggles a small panel below it
- Panel holds one hue slider (0–359) over a rainbow gradient track; dragging it recolors the blob live
- `hue` state lives in `App.jsx` and is passed to both `MonsterHop` and `ColorPicker`; `handleHueChange` writes to `localStorage` on every change
- Game keeps running while the panel is open (no pause, no modal overlay)

### Size
- Controlled by a `size` multiplier (default `0.5`, so the SVG renders at 100×100px on first visit)
- Applied as `width={SVG_BASE_SIZE * size}` — `viewBox` stays `0 0 200 200` so all path coordinates are stable
- **Persisted in `localStorage` as `monsterSize`** — any value that parses as a number is accepted
- Grows by +0.04 each time the monster eats (no cap — grows infinitely)

### Animation
- All keyframes live in the `STYLES` template string inside `MonsterHop.jsx`, injected via an inline `<style>` tag — there is no separate CSS file for the monster
- `mhHop` (980ms) is the whole idle motion: arc up at 13%, land at 29%, then a decaying jello wobble through 100%. There is no separate always-on idle pulse
- `mhShadow` (980ms) shrinks/fades the ground shadow in sync with the arc
- `mhGulp` (600ms) then `mhShimmy` (500ms) play on eating; `heartBurst` (3s) lives in `App.jsx`
- `transform-origin: center bottom` on the animated wrapper so squash anchors to the feet

### Petting (`MonsterHop.jsx` + `src/constants/petting.js`)
- Nintendogs model: the blob reacts to a pointer held down **and moving**. Hold still and the reaction decays even with the button down
- **Lean** — the body chases the pointer's horizontal offset, damped at `PET_LEAN_DAMPING` per frame so it trails a beat behind rather than snapping. Offset is `PET_LEAN_WIDTH_RATIO` of the blob's own rendered width, so the gesture reads the same at every size
- **Shimmy** — `mhPetShimmy` runs only while actively rubbing. Its shift is a *percentage* of the blob's width, so it scales with the body without size math
- **Pleased face** — the celebration smile reused, plus blush. Petting does not get its own eye shapes; the blush and hearts carry the difference. Follows the rubbing, not the press: stop moving and it fades after `PET_EXPRESSION_HOLD_MS`, while the lean stays, since a motionless finger is still touching the blob
- **Hearts** — launched every `PET_HEART_INTERVAL_MS`, faster than the `PET_HEART_MS` they take to fade, so a steady rub keeps two or three rising at once, capped at `PET_HEART_MAX_CONCURRENT`. Sides alternate; scatter and a varied lifetime per heart keep the stream off a metronome. Sized and offset off the blob's width; the rise is in `em` so it scales with the heart. Smaller than the celebration hearts, which stay the louder moment. Stop rubbing and launches stop; whatever is airborne finishes
- Heart launches are decided outside the `setPetHearts` updater, with `heartsRef` as the source of truth. A `setState` updater must be pure — StrictMode invokes it twice, which silently cancelled the alternating-side flip when it lived inside
- The blob container sets `user-select: none` and `startPet` calls `preventDefault`, because a press-drag would otherwise start a text selection and paint the hearts with the selection highlight
- **Freeze + linger** — wandering stops on touch and resumes `PET_LINGER_MS` after release
- Three nested transform layers, because a CSS animation would overwrite an inline transform: hop keyframes → JS lean → CSS shimmy → svg
- Blocked unless `feedPhase` is IDLE and the blob is neither eating nor celebrating. Pointer events, so touch works
- Session-only: no growth, nothing persisted

### Mobile / touch (`src/constants/layout.js`)
- **Pointer events everywhere.** A touch device fires no `mousemove` at all, so any drag built on mouse events silently degrades: the crumpled ball never tracks the finger, no velocity is recorded, and every throw becomes a drop where you tapped. `CrumpledBall` and `FeedingMechanic` listen for `pointermove`/`pointerup`/`pointercancel`
- **Compose panel** caps at `PAPER_MAX_WIDTH_PX` but never exceeds the viewport minus `PAPER_EDGE_GAP_PX` on each side, so it cannot hang off a narrow phone
- **Touch targets** reach `TOUCH_TARGET_MIN_PX`. The feed button gets there with padding, keeping its icon the same size; the gear grows below `MOBILE_BREAKPOINT_PX`
- **Hover styles are wrapped in `@media (hover: hover)`.** On a touch screen a tapped `:hover` sticks until you tap elsewhere, which left the gear permanently rotated and the stamp permanently inverted
- **`100dvh`, not `100vh`** — mobile browser chrome makes `100vh` taller than the visible area
- `touch-action: none` and `overscroll-behavior: none` on `html, body` so dragging a ball or rubbing the blob cannot scroll or bounce the page. `textarea`/`input` opt back in, so typing and the hue slider still work
- Celebration hearts scale off the blob via `CELEBRATION_HEART_SIZE_RATIO`; at a fixed size they nearly matched the width of a phone-sized blob

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

### Feature: Celebration Animation
**What was added**: After the monster finishes eating:
1. **Joy jumps** — Monster does 3 celebration jumps (700ms spacing) while staying in place
2. **Smiling expression** — the eyes curve into arcs during celebration, then return to neutral dots. The blob has no mouth
3. **Heart bursts** — 3 hearts burst upward with each jump (12 total: initial burst + 3 jumps × 3 hearts each)
   - Hearts spread horizontally around monster center (`(i - 1) * 100 * monsterSize`), middle heart sits slightly higher
   - Staggered 20ms delays per heart for a light cascade
   - Fly upward 180px and fade out over 3s (`heartBurst` keyframe in `App.jsx`)
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
3. **Size growth**: Monster grows +0.04 size per eaten ball, persisted to localStorage.
4. **Monster pathfinding**: Pursues ball, eats it on arrival, returns to idle.

### Session: Size Persistence & Bug Fixes
**Changes**:
- localStorage key standardized to `monsterSize`
- Ball visual snap on landing: fixed by CSS-transitioning rotation to 0deg + filter removal before React swap

## Standing Instructions

### Git & Commits
- **Author**: Always commit as Ruba Sbeih <rsasbeih@gmail.com>
- **Format**: Use Co-Authored-By line: `Co-Authored-By: Ruba Sbeih <rsasbeih@gmail.com>`
- **Never** include Claude as co-author
- Create new commits (don't amend unless user explicitly requests)
- Push immediately after committing

#### What belongs in a commit message or PR description
- **The baseline is `main`, not your first draft.** Describe how the code differs from what the reader already has. That is the only comparison they can make
- **Never narrate your own working process.** A bug you introduced and fixed before anyone else saw it did not happen as far as the repo is concerned. No "fixed a bug found while iterating", no "my first attempt did X", no "round 3 changed Y", no "the tests caught Z in my own code", no "two bugs worth flagging"
- The test: *would this line make sense to someone who has never seen my earlier attempts?* If it only makes sense to someone who watched me work, cut it
- Keep the **rationale**, drop the **story**. `startPet calls preventDefault, because a press-drag would otherwise start a text selection` explains why the code is shaped this way and stays. `the hearts had a blue box until I fixed the selection highlight` is the same fact told as a diary and goes
- **Iteration belongs in the conversation, not in artifacts.** Report each round while working — that is wanted — then let it go. It does not graduate into the commit message, the PR body, or the docs
- **Describe the diff, nothing else.** Investigation findings, reassurance about things that did not change, next steps, merge-order advice, "if X still happens try Y" — all of that is conversation. A reader opens a PR to see what changed and why, not to read the debugging session that led to it. If a line is not about the diff, it does not belong
  - `DNS needs no change, the records already resolve correctly` — cut. Nothing in the diff touches DNS
  - `Merge this one first, it is independent of #11` — cut. Say it in chat
  - `If Settings still shows an error, re-run the check` — cut. Support advice, not a code change
- **No session links, transcript URLs, or internal tooling identifiers.** This repository is public. A plain `Generated with Claude Code` attribution line is fine; anything carrying a session or conversation ID is not

### Testing & QA
- **Run `npm run test:regression` after every feature, before committing.** Needs `npm run dev` already running. Headless, ~25s, exits non-zero on failure
- It covers the *existing* features end to end: boot, color picker → blob repaint, the full compose → crumple → throw → settle → pursue → eat → grow chain, persistence across reload, and zero console errors
- The growth check is the load-bearing one — `monsterSize` only increases in `localStorage` if the entire feeding chain completed, so one assertion guards the whole mechanic
- **Add a case to `qa/regression.mjs` when you ship a feature**, so the next feature can't silently break it
- The suite does not cover animation *feel* (timing, easing, juice). That still needs eyes on the real app — screenshot or describe the result
- Never write a check that reports PASS without asserting something

### Documentation — update all four before every PR
No PR ships without the docs matching the code. Do it in the same commit as the change, not as a follow-up, or it never happens. Each file has one job and they do not overlap:

| File | Holds | Update when |
|---|---|---|
| `CLAUDE.md` | How the thing works *now*, for the next session. Architecture, behavior, constants that matter | Any behavior or structure changed |
| `SPEC.md` | The feature spec: what is implemented, with its numbers, and what is still planned | A feature ships (move it out of Planned) or a documented value changes |
| `PROGRESS.md` | Status only: what is built, what is next, the metrics table | A feature ships, priorities reorder, or the assertion count changes |
| `DECISIONS.md` | Decisions and their reasoning, including what was rejected and why | You made a call someone could reasonably question later |

- **`DECISIONS.md` is the one that gets forgotten.** If you chose between two defensible approaches, that belongs here — including the option you did not take. A future session that cannot see the alternatives will re-litigate the choice or quietly undo it
- All four follow the rules above: **present tense, current state, no self-narration.** A decision entry says why the design *is* what it is, not the order in which you tried things
- Not every change touches all four. A pure bug fix may only need `CLAUDE.md`. But check all four every time, and say which you updated

### Code Quality
- **Write what is true now, never what it used to be.** Correct the value and move on. No `// was 1.0`, no `(previously capped at 2.0)`, no `*(later reverted — see below)*`, no "this used to be X". Applies to code comments, CLAUDE.md, SPEC.md, PROGRESS.md, README — everything in the repo
  - The reasoning behind a change goes in the **commit message**, where git keeps it attached to the diff that made it. That is the only place history belongs
  - A reader should learn the current state in one pass, without reconstructing a timeline to work out which number is live
  - This does not conflict with "why not what" below: explain why the code *is* the way it is, in the present tense. `// 180px covers the worst-case gap when a large blob is edge-clamped` is good. `// raised from 135px because the old value got stuck` is not
  - When a fact turns out to be wrong or stale, **replace** it. Do not annotate it, strike it through, or leave it with a correction underneath
- **One-liner JSDoc headers**: Every `.jsx` and `.js` file starts with purpose description
  - Format: `/** Brief description of module purpose. */`
  - Helps AI agents understand context without reading whole file
- **Comments for "why" not "what"**: Code should be self-documenting with good names
- **Clear naming**: No abbreviations unless unavoidable (e.g., `updatePosition` not `upPos`)
- **Extract magic numbers**: Use `src/constants/` for values used in multiple files
- **Enums for state**: Use enum constants for phases/states, not magic strings
- **DRY principle**: Extract duplicate SVG/logic into reusable components

### Development Practices
- **No over-engineering**: Build what's needed now, don't architect for features we "might" do later
- **Measure actual behavior**: When accuracy matters, read the code or test, don't trust documentation
- **No feature scope creep**: Implement exactly what's requested, no "nice-to-haves"
- **Debug thoroughly**: Diagnose root cause before asking user for more info
- **Terse communication**: Short updates, no verbose summaries or narration

### Architecture Principles
- **Front-end only**: No backend, no server calls, no future backend-ready code
- **localStorage for persistence**: Only persistence layer we use
- **CSS animations over JS**: Use CSS `@keyframes` for smooth GPU-accelerated animations
- **SVG for graphics**: Blob and visual elements are SVG, not canvas or sprites
- **Canvas for particles**: Only particle effects use canvas (performance)

### Deployment
- **GitHub Pages**: Final deploy target via GitHub Actions
- **Automated CI/CD**: Every push to main triggers build and deploy
- **No manual deploys**: Workflow handles everything

## Planned / not yet done
- Blob squashing at screen edges
- Additional expressions/states (future)
