# unfortunately — Decision Log

This document records every major decision made during development: architecture choices, design decisions, features tried/rejected, and why each decision was made.

---

## Architecture & Technology

### ✅ Front-End Only (No Backend)

**Decision:** All game logic, persistence, and mechanics live entirely in the browser. Zero server-side code.

**Why:** 
- Core meta-goal of the project: prove you can build a complete game loop entirely in frontend
- No deployment complexity, no hosting costs, no server maintenance
- Open-source friendliness: forkers can run it as static files
- Eliminates need for database, authentication, API infrastructure

**Constraints This Creates:**
- No cloud save/sync across devices
- No multiplayer or social features
- All persistence via localStorage only
- Means any new features must remain client-side

---

### ✅ React + Vite

**Decision:** React for component model, Vite for build tool.

**Why:**
- React familiar, battle-tested, good for UI state management
- Vite fast build times and HMR (hot module reloading)
- Small bundle size compared to Create React App
- Modern tooling without bloat

**Rejected Alternatives:** (Implicit)
- Vue/Svelte (not chosen, reason not explicitly discussed)
- Webpack (too slow iteration)
- Parcel (Vite preferred for speed)

---

### ✅ localStorage for All Persistence

**Decision:** Browser localStorage is the only persistence layer.

**Keys:**
- `monsterHue` — random color (0–359)
- `monsterSize` — current blob size (0.5 default)

**Why:**
- Front-end only requirement
- No backend to sync to
- Simple and reliable for single-device use
- Survives page reload, auto-cleared in incognito

**Limitations:**
- Only works within same browser/device
- Cleared if user clears browser data
- No multi-device sync
- Incognito mode gets fresh start each session

---

### ✅ GitHub Pages + GitHub Actions Deployment

**Decision:** Deploy to GitHub Pages via automated GitHub Actions workflow.

**Workflow:**
- Push to `main` → Actions triggers
- Runs `npm ci && npm run build`
- Deploys `dist/` to GitHub Pages

**Why:**
- Free hosting for static sites
- Automated deployment (no manual deploys)
- Built into GitHub (no third-party CI needed)
- `vite.config.js` sets `base: '/unfortunately/'` for correct path

**Why Not:**
- Custom domain: not set up (could add later)
- Other hosts (Netlify, Vercel): GitHub Pages sufficient for now

---

### ✅ SVG for Blob Graphics (Not Canvas, Not Sprites)

**Decision:** Blob is pure SVG using cubic bezier curves, not pre-rendered sprites or canvas.

**Why:**
- Infinitely scalable (blob grows without pixelation)
- Small file size (single path definition)
- Easy color changes (just swap HSL values)
- Smooth animations possible with CSS
- Gloss/glow effects easy with SVG filters

**Path Used:**
```
M 100,25 C 148,22 192,62 194,108 C 196,148 168,178 100,180 C 32,178 4,148 6,108 C 8,62 52,22 100,25 Z
```

**Why This Shape:**
- Deliberately "squatter" (wider than tall) to match jello/slime aesthetic
- Single continuous path (no seams)
- Smooth cubic bezier curves (no sharp angles)

---

### ✅ Canvas for Eating Animation Particles

**Decision:** Particle effects during eating animation use Canvas overlay, not DOM elements.

**Why:**
- Rendering ~16 particles per eat as DOM elements = expensive
- Canvas single render pass much faster
- No per-particle event listeners
- Cleaner visual without DOM bloat

**Trade-off:** Canvas is imperative (less React-like), but performance gain justified

---

### ✅ CSS Keyframe Animations (Not JavaScript Animations)

**Decision:** All animations (hop, squish, celebration) use CSS `@keyframes`, not JS-driven animations.

**Why:**
- GPU-accelerated (60fps smooth)
- Runs independently of React render cycle
- Lower CPU usage
- Simpler code (animation = class toggle)

**Animations:**
- `@keyframes mhHop` — monster hopping (280ms flight + jello recovery)
- `@keyframes mhShadow` — shadow movement during hop
- `@keyframes squish` — body compress/expand idle animation
- `@keyframes heartBurst` — hearts rising and fading
- `@keyframes mhGulp` — eating gulp animation
- `@keyframes mhShimmy` — celebration shimmy

---

## Design Decisions

### ✅ Blob Shape Is Finalized (Never Changes)

**Decision:** The blob silhouette will not change. Only the color and facial expressions can vary.

**Why:**
- Provides consistent visual identity
- User confirmed: "the design is finalized as of now"
- Simplifies future feature work (don't redesign body)

**Implications:**
- SVG path is locked
- Size multiplier only knob for scale
- Expressions added via eyes/mouth, not shape deformation

---

### ✅ Single Hue Value Drives All Colors

**Decision:** All blob colors (body light, body mid, body dark, glow, gloss) derived from one HSL hue (0–359).

**Formula:**
- Body Light: `hsl(hue, 72%, 91%)`
- Body Mid: `hsl(hue, 55%, 67%)`
- Body Dark: `hsl(hue, 55%, 45%)`
- Glow: `hsl((hue+20)%360, 80%, 62%)` — shifted +20° for "light from below"
- Gloss: `hsl(hue, 65%, 95%)` — pale version of hue

**Why:**
- One value to control whole palette (consistent look)
- Easy color changes (just rotate hue)
- Mathematically derived (no manual color tweaking)
- Gloss NOT white (tested, looked like a sticker)

**Rejected:** 
- White gloss (looked wrong)
- Grayscale hue-based colors (tried, not needed)

---

### ❌ Eyes Are Pure Black (#000), Not Hue-Derived

**Decision:** Eyes stay black regardless of monster hue. Immune to color changes.

**Why:**
- User explicitly requested: "i want the eyes of the monster to stay black, dont want them to be part of the hue"
- Black eyes stay visible on any blob color
- Professional/timeless look

**Change History:**
- Originally: eyes used BALL_CREASE_SECONDARY color (gray, hue-derived)
- Rejected: did not match user intent
- Fixed: hardcoded `#000`, removed hue dependency

---

### ✅ Gloss Highlight Follows Fixed Light Source

**Decision:** The glossy highlight at blob's upper-left tracks a fixed light source at screen top-center.

**Why:**
- Creates illusion of lighting from above
- Moves realistically as monster moves
- Requires `transform-box: fill-box` and screen-space math

**Implementation:**
- ClipPath to prevent blur bleed outside silhouette
- Two-layer gloss: soft halo + tight bright core
- Recalculated on every render based on monster position

---

### ✅ Default Size 0.5 (Not 1.0, Not Smaller)

**Decision:** Monster starts at size 0.5, which means 100×100px (SVG base is 200×200).

**Why:**
- User confirmed: "0.5 was where it was small enough where I felt like it was starting small, but it wasn't too small you couldn't see any of the features"
- Small enough to feel intentional ("starting small")
- Large enough to see all blob features clearly
- Not 1.0 (would be too large out of the gate)

**Size Mechanics:**
- Grows +0.04 per eat
- No cap (grows infinitely)
- Persisted to localStorage

---

### ✅ Monster Grows Infinitely (No Size Cap)

**Decision:** Monster has no maximum size. Can grow as large as desired.

**Why:**
- User wants chaos: "I want it to grow super big, and I want it to get to a state where it's like, it can't fit in the screen, and it's kinda like, squeezed by the four edges"
- Fun to watch blob exceed screen bounds
- Encourages repeated feeding

**Visual Effect (Planned):**
- When blob exceeds screen bounds, it visibly squashes/gets squeezed
- Creates visual feedback that it's too big

---

### ✅ Monster Never Goes Off-Screen

**Decision:** Monster position is clamped to playable area. Cannot exit screen edges.

**Why:**
- User requirement: "I should never get to a state where the ball is off screen"
- Ensures monster always visible
- Affects food arrival threshold calculation (180px accounts for edge clamping at size=1.0)

---

### ✅ Random Color on First Visit

**Decision:** First time visiting app, blob gets random hue (0–359). Same color every reload after (persisted).

**Implementation:**
- `useState` initializer generates random hue once on component mount
- Saves to localStorage as `monsterHue`
- On reload, reads from localStorage

**Change History:**
- Initially: hue defaulted to 200 (blue) and never saved
- Problem: every visit got blue, no randomization
- Fixed: generate random on first visit, save to localStorage, read on reload

**Incognito Behavior:**
- Separate localStorage per window
- First visit: random color (separate from normal browsing)
- On close: cleared (browser default)

---

### ❌ No Color Exclusion List

**Decision:** No "bad colors" excluded. Any hue 0–359 is valid.

**Why:**
- User: "I don't know if I wanna exclude any bad colors"
- Keeps implementation simple
- User can always change color if they don't like it (color picker planned)

---

### ✅ Blob Can Change Color

**Decision:** The user changes blob color via the settings UI.

**Why:**
- User's sister requested this feature
- Simple to implement (just change hue value)
- Doesn't break front-end-only constraint

**Implementation (Planned):**
- Settings button in top-right corner
- Color picker (simple hue slider or input)
- Game continues running while picker open
- New hue saves to localStorage

---

## Ball Physics Decisions

### ✅ Ball Physics Is Temporary/POC

**Decision:** Current physics is accepted as "good enough" for now but flagged as temporary.

**Current Physics Constants:**
- Gravity: 0.5 px/frame², fades to 0 over 4 bounces
- Friction: 0.99→0.97 (tightens with bounces)
- COR (Coefficient of Restitution): 0.65 all surfaces
- Wall dampen: ×0.9 additional horizontal velocity loss
- Sleep threshold: when `hypot(vx, vy) < 0.4` px/frame
- Squash on impact: 65ms squash + 95ms return (±0.28 scale)

**Why Accepted Despite Issues:**
- User said: "I kinda just let AI make me a physics engine. I'm not too happy with it. Uh, I might change it later on, but right now it's a good enough, um, for a first POC."
- Works well enough for gameplay
- User didn't want to over-engineer early

**Why Might Change:**
- Physics feel hand-wavy (not based on real-world simulation)
- Could be optimized or replaced with better engine
- But: user actually likes current behavior, so low priority

---

### ✅ 0.25px/ms Throw Velocity Minimum

**Decision:** Ball only launches if throw velocity >= 0.25px/ms. Below that, ball drops in place.

**Why:**
- Prevents accidental tiny throws
- Provides clear threshold for "did I throw or not"
- Feels intentional

**Origin:** Tuned empirically during playtesting (exact reason not documented)

---

### ✅ Ball Bounces on All Four Walls + Floor + Ceiling

**Decision:** Ball physics handles all six surfaces (left, right, floor, ceiling).

**Why:**
- More interesting ball trajectories
- Whole screen is playable
- Feels more chaotic (fun)

**Constraint:** User requirement that ball never goes off-screen means these bounces handle it

---

### ❌ Ball Physics Regression Reverted

**Incident:** After implementing eating animation, ball bounced too energetically and settled too slowly.

**Decision:** Reverted physics constants to baseline, kept squash animation.

**What Changed:**
- Reverted: COR, gravity fade, friction
- Kept: squash animation on bounce (65ms + 95ms recovery) — "juice" per GDC research

**Why:**
- User: "So some things that I'm not sure how to slow..." (physics too fast)
- Baseline physics eliminated oscillation at walls
- Settled ball cleanly within 4–5 seconds

---

## Monster Movement Decisions

### ✅ 90px Hop Distance (STEP = 90)

**Decision:** Monster hops 90px at a time when wandering.

**Why:** Not explicitly stated, but appears to be tuned for screen-feeling (90px is ~1/12th of typical screen width)

**Locked For Now:**
- Not scaling with monster size (intentional to keep simple)
- Could change if mobile/responsive design needs it

---

### ✅ 280ms Hop Flight Time (HOP_MS = 280)

**Decision:** Monster is in air for 280ms per hop, with jello recovery making full cycle 980ms total.

**Why:** Tuned to feel "bouncy" but not frantic

**Animation Timings:**
- 0%–13% of cycle: arc peak (126ms, up)
- 13%–29% of cycle: descent and landing (154ms, down)
- 29%–100% of cycle: jello recovery (700ms, wobble)

---

### ✅ 180px Food Arrival Threshold (STEP × 2.0)

**Decision:** Monster considers food "arrived" when within 180px of blob center.

**Why:**
- At size=1.0, monster center is clamped 150px from screen edges
- Food at corner could be 144px away, causing infinite loop if threshold was smaller
- 180px (STEP × 2.0) covers worst-case geometry

**Change History:**
- Initially: 135px (STEP × 1.5)
- Problem: monster got stuck on certain screen positions
- Fixed: increased to 180px

---

### ✅ 81px Wander Arrival Threshold (STEP × 0.9)

**Decision:** Monster arrives at wander destination when within 81px.

**Why:** Allows natural completion without overshooting

---

### ✅ Random Wander Pauses (1.5–3.5 seconds)

**Decision:** Between hops, monster pauses for random duration between 1.5–3.5s.

**Why:** Feels natural, gives rhythm to wandering

**Could Change:** User said "random wander pauses could change" — not locked

---

### ✅ 30% Smile Chance on Wander Arrival

**Decision:** When monster reaches wander destination, 30% chance to smile (1500ms duration).

**Why:** User said "I just kinda like it" — kept for personality

**Could Change:** User said "the monster smiling is at Rand, like, a thirty percent chance is something that I might change later on"

---

### ❌ Monster Hop Regression

**Incident:** After changing size to 1.0, monster hop became too fast and got stuck on certain screen positions.

**Decision:** Increased food arrival threshold from 135px to 180px.

**Why:** Size=1.0 changed the geometry; monster clamping at edges meant farther distances to food

---

## Eating & Growth Decisions

### ✅ Growth +0.04 Per Eat (No Cap)

**Decision:** Every time monster eats, size increases by 0.04. No maximum size.

**Why:**
- Small incremental growth feels satisfying
- No cap encourages repeated feeding
- User wants infinite chaos: "I want it to grow super big"

**Persisted:**
- Saved to localStorage as `monsterSize`
- Survives page reload

---

### ✅ Celebration Every Eat (Not Selective)

**Decision:** Every time monster finishes eating, celebration plays (jumps + hearts).

**Why:** Consistent positive feedback

**Could Change:** User said "celebrations could change" but currently: same for every eat

**Won't Vary By:**
- Food size (all balls same size)
- Blob size (always same celebration)

---

### ✅ Eating Animation Timeline

**Decision:** Fixed animation sequence:
- 280ms: ball travels to center (ease-in quad)
- 90ms: white flash at 300ms mark
- 150ms: particles burst outward (ease-out quad)
- 420ms: particles converge inward (ease-in cubic)
- Total: ~800ms

**Why:** Tested empirically to feel satisfying

**Components:**
- 5 suction particles drift in (visual anticipation)
- White radial flash (absorption moment)
- 16 burst particles (celebration)

---

### ✅ Canvas for Particles (Not DOM)

**Decision:** Eating animation particles render to canvas overlay, not as DOM elements.

**Why:** Performance; ~16 particles per eat would be expensive as DOM

---

## Code Organization Decisions

### ✅ Extracted Magic Constants

**Decision:** Moved magic numbers to `src/constants/` folder:
- `sizes.js` — `SVG_BASE_SIZE = 200`
- `paperPhase.js` — phase enums (IDLE, COMPOSING, THROWING, LANDED, BEING_EATEN)
- `eatPhases.js` — eating phases (NONE, GULP, SHIMMY)
- `colors.js` — color constants (BALL_LIGHT, PAPER_LIGHT, etc.)

**Why:** 
- Centralize values that appear in multiple files
- Easy to find and tweak
- Prevents magic numbers scattered through code
- Makes refactoring easier

---

### ✅ CreaseLines Component

**Decision:** Extracted duplicate SVG crease pattern into reusable component `src/feeding/CreaseLines.jsx`.

**Why:**
- Was duplicated 4 times across components
- DRY principle
- Easier to modify crease look in one place

---

### ✅ One-Liner JSDoc File Headers (Planned)

**Decision:** Every `.jsx` and `.js` file will start with JSDoc one-liner describing purpose.

**Format:**
```js
/** Renders the blob monster with SVG, handles position and eating animations. */
```

**Why:**
- AI agents can read header instead of reading entire file
- Humans get quick understanding of module purpose
- Improves AI-friendly code quality

**Not Yet Implemented:** Planned for next refactor pass

---

### ✅ Clear Naming Conventions (No Abbreviations)

**Decision:** Variable/function names should be descriptive, no abbreviations unless necessary.

**Why:**
- Readable by both humans and AI
- Reduces cognitive load
- Makes diffs clearer

**Examples Rejected:**
- `upPos` → `updatePosition`
- `cel` → `isCelebrating`
- `hm` → `hopKey`

---

### ✅ Comments for "Why" Not "What"

**Decision:** Comments explain non-obvious reasoning, not what code obviously does.

**Why:**
- Code is self-documenting if named well
- "Why" comments survive refactoring
- "What" comments become stale and confusing

---

### ❌ Code Is Somewhat Messy (Acknowledged)

**Decision:** User acknowledged: "The code is kind of a mess. I clean it up as much as I could, but there is a lot of things that I still don't know that it... that is doing wrong because I I did try to lean on AI."

**Why It Happened:**
- User experimented with how far AI could go
- Leaned on AI for exploration without full understanding
- Accepted tradeoff for speed of learning

**Plan to Fix:**
- Make code more readable for both humans and AI
- Add file headers and better naming
- Refactor for clarity (but not over-engineer)

---

## Feature Requests & Rejections

### ✅ Petting Mechanic (Planned)

**Decision:** Add ability for user to pet blob without feeding to trigger happiness.

**Why:**
- User wants more ways to interact with blob
- Natural pet simulator feature
- Adds depth without complexity

**Implementation (Planned):**
- Desktop: click to pet, multiple clicks continue
- Mobile: long-press and drag to pet
- Triggers different happy expression

---

### ✅ Mobile Optimization (Planned)

**Decision:** Make game mobile-friendly with touch controls.

**Why:**
- User wants it playable on phones
- Touch-drag throwing instead of mouse drag

**What Stays Same:**
- Blob size (0.5 default on all devices)

**What Changes:**
- Throwing mechanic (touch drag instead of mouse)
- UI responsiveness

---

### ❌ No Mouth / Permanent Facial Features

**Decision:** Blob will NOT get a permanent mouth or nose.

**Why:**
- User: "the design of the blob is finalized as of now"
- Shape is locked, only expressions change
- Keeps aesthetic consistent

**What's Allowed:**
- Different eye expressions (happy, sad, sleepy, etc.)
- Temporary mouth for expressions (smile during celebration)

---

### ❌ No Multiple Pets (For Now)

**Decision:** Single pet per browser/device. Multiple pets idea rejected for now.

**Why:**
- User: "I never want to over engineer for something that we might do in the future"
- Keep it simple; refactor when needed
- No architectural prep for multi-pet (don't over-engineer)

**Future Idea (Not Implementing):**
- Pets grow big and go into background
- User spawns new baby pet and restarts
- Cool concept but premature

**Implication:** Don't scope localStorage keys by pet ID; keep it simple

---

### ❌ No Stats or Progression System

**Decision:** No hunger, happiness meter, health bar, or progression.

**Why:**
- User: "the master doesn't feel hunger, but it does like to eat"
- Keeps game simple and chill
- Current design: blob just likes eating, no requirements

**Uncertain:** Might add later if needed, but not planning for it

---

### ❌ No Backend / Server Features

**Decision:** Explicitly rejecting any backend-dependent features.

**Why:**
- Core principle: front-end only
- User: "I don't really wanna do any features that require a back end"
- Keeps project simple and open-source friendly

**Includes Rejecting:**
- Cloud save/sync across devices
- Multiplayer/social features
- Leaderboards
- User accounts
- Analytics/tracking

---

### ❌ No Permanent Analytics or Tracking

**Decision:** No analytics, no telemetry, no tracking.

**Why:**
- User: "For now, we don't have any analytics or or or tracking"
- Respects privacy (no backend anyway)
- Open-source friendliness (users control their data)

---

### ❌ No Custom Domain (Yet)

**Decision:** Using GitHub Pages default domain. Not setting up custom domain now.

**Why:**
- Works fine as-is
- Can add later if needed

---

### ❌ No Preset Color Palette (Uncertain)

**Decision:** Color picker uses continuous hue slider (0–359), not preset palette.

**Why:**
- User: "I wanna just have a simple color picker"
- Maybe preset colors later

---

### ❌ No Color History

**Decision:** When user changes blob color, old color not saved anywhere.

**Why:**
- Keeps localStorage simple
- User doesn't want history

---

### ❌ Game Doesn't Pause During Color Picker

**Decision:** Color picker opens while game continues running.

**Why:**
- User: "I I just wanted to to be a simple color picker"
- No pause state needed
- Simpler implementation

---

## Petting Decisions

### ✅ Motion-Gated, Not Press-Gated (Nintendogs Model)

**Decision:** The blob reacts to a pointer held down **and moving**. Holding still lets the reaction decay even while the button is down.

**Why:**
- Nintendogs rewards continuous rubbing; the dog stops reacting the moment the stylus stops. That gate is most of what makes it feel like touching a creature rather than pressing a button
- A press-only model turns the blob into a button you depress

**Rejected Alternatives:**
- **Hold anywhere, no motion required** — more forgiving with a mouse and easier to discover, but the blob keeps reacting while your hand is still, which reads as a stuck state
- **Click repeatedly** — simplest to build and very discoverable, but it is poking, not petting

---

### ✅ Lean Is Contact, Shimmy and Face Are Enjoyment

**Decision:** When the pointer stops moving but stays down, the shimmy and the pleased face fade while the lean stays.

**Why:**
- A motionless finger is still physically touching the blob, so the body stays pushed over
- But it is no longer being rubbed, so the enjoyment stops
- Splitting the two is what makes holding still read as "still touching, no longer enjoying" rather than as a bug

---

### ✅ Petting Reuses the Celebration Smile

**Decision:** No dedicated eye shapes for petting. Blush and hearts carry the difference.

**Why:**
- A third face is more vocabulary than the blob needs
- The purpose-built squint sat lower and wider than the celebration arcs and read as a different character
- Blush is new vocabulary that is reusable elsewhere; a third eye shape is not

---

### ✅ Everything Proportional to Blob Width

**Decision:** Lean distance is a fraction of the blob's rendered width, the shimmy shift is a CSS percentage, and the heart rise is in `em`.

**Why:**
- The blob's size changes with every meal and is unbounded, so any pixel constant is correct at exactly one size
- Percentages and `em` make the browser do the scaling, so there is no size math to keep in sync

---

### ✅ Hearts Overlap Rather Than Queue

**Decision:** Hearts launch every `PET_HEART_INTERVAL_MS`, faster than the `PET_HEART_MS` they take to fade, so two or three ride up together, capped at three.

**Why:**
- Strictly sequential hearts read as sparse and metronomic
- Launching faster than they fade is what produces a stream instead of a queue

**Detail:** At the cap a launch is skipped rather than evicting a heart mid-flight, so none ever pop out of existence on screen.

---

### ✅ Petting Is Session-Only

**Decision:** No growth, nothing persisted.

**Why:**
- Growth is the reward for feeding; giving petting the same reward flattens the distinction
- Petting is for its own sake

---

## Mobile Decisions

### ✅ Pointer Events, Not Mouse Events

**Decision:** All drag interactions listen for `pointermove`/`pointerup`/`pointercancel`.

**Why:**
- A touch device fires no `mousemove` at all. A drag built on mouse events does not error, it silently degrades: the ball never tracks the finger, no velocity is recorded, and every throw falls through to the drop path
- One set of handlers covers mouse, touch and stylus, so there is no branch to keep in sync

---

### ✅ Hover Styles Behind `@media (hover: hover)`

**Decision:** Every `:hover` rule is guarded; the crumple stamp additionally gets `:active`.

**Why:**
- On a touch screen a tapped `:hover` sticks until you tap elsewhere, leaving the gear permanently rotated and the stamp permanently inverted
- `:active` restores tap feedback that the guard would otherwise remove

---

### ✅ Blob Size Stays 0.5 on Mobile

**Decision:** No separate mobile default size.

**Why:**
- 0.5 renders at 100×100px, which is already comfortable on a phone
- A device-dependent default would make `monsterSize` mean different things on different screens, and it persists across devices via the same key

---

### ✅ Compose Panel Caps, Never Shrinks Below a Gap

**Decision:** `min(400px, 100vw - 2 × gap)` rather than a mobile-specific layout.

**Why:**
- One rule covers every width instead of a breakpoint that needs maintaining
- Keeps the desktop panel exactly as it was while guaranteeing the panel can never hang off a narrow screen

**Rejected Alternative:** A full-screen compose sheet on mobile. More native-feeling, but it hides the blob entirely and is a much larger change than the overflow warranted.

---

## Bug Fixes & Workarounds

### 🐛 Size Persistence Not Working

**Issue:** Monster size was resetting to 0.5 every reload despite localStorage save.

**Root Cause:** Validation check `parsed >= 1.0` was too strict. Sizes like 0.54 (0.5 + 0.04) failed validation and defaulted to 0.5.

**Solution:** Removed `>= 1.0` check, kept only null/NaN validation.

**Reasoning:** We control what gets saved, so just trust non-null parsed values.

---

### 🐛 Random Color Generation Not Working

**Issue:** Blob always appeared blue (#200 hue default), never persisted color.

**Root Cause:** Hue initialization only read localStorage, never wrote random color on first visit.

**Solution:** 
1. Added random generation: `Math.floor(Math.random() * 360)`
2. Save immediately to localStorage
3. Use `useState` initializer (not component body) to run only once per mount

**Why useState Initializer:**
- Component body code runs on every render
- useState initializer runs only once on mount
- Prevents recalculating on every state change

---

### 🐛 Ball Snapping on Landing

**Issue:** Ball rotated visually while landing, looked jerky.

**Solution:** CSS-transition rotation to 0° + remove filter before React swap.

**Why:** Smooth visual settling instead of instant snap.

---

### 🐛 Eyes Not Staying Black

**Issue:** Eyes were using hue-derived color (gray), changed with blob color.

**User Feedback:** "i want the eyes of the monster to stay black, dont want them to be part of the hue"

**Solution:** Hardcoded eyes to `#000`, removed hue dependency.

---

### 🐛 Phase Enum Mismatches

**Issue:** FeedingMechanic.jsx was checking `PaperPhase.HOLDING` for ProjectileBall render (wrong phase).

**Root Cause:** String-based phases were error-prone; enum created but not consistently used.

**Solution:** Created `src/constants/paperPhase.js` with all phases, updated all references.

**Phases:**
- IDLE
- COMPOSING
- HOLDING
- THROWING
- LANDED
- BEING_EATEN

---

### 🐛 Monster Hop Regression

**Issue:** After size change to 1.0, monster hop became too fast and got stuck.

**Solution:** Increased food arrival threshold from 135px to 180px.

**Reasoning:** Size=1.0 changed geometry; edge-clamping made distances farther.

---

### 🐛 Ball Physics Too Energetic

**Issue:** After eating animation added, ball bounced too energetically, settled too slowly.

**Solution:** Reverted physics constants to baseline, kept squash animation.

**Decision:** Baseline physics felt better; added squash animation provides "juice" without making ball chaotic.

---

### 🐛 Git Authorship

**Issue:** Initial commits showed Claude as co-author.

**User Feedback:** "I just realized that you're pushing as Claude and not as me. Is that normal?"

**Solution:** Amended commits to be authored only by Ruba Sbeih (rsasbeih@gmail.com), removed Claude co-author line.

---

### 🐛 GitHub Actions Build Failure

**Issue:** Workflow failed with "Dependencies lock file is not found" even though package-lock.json existed locally.

**Root Cause:** package-lock.json was in .gitignore, so not committed to repo.

**Solution:** Removed package-lock.json from .gitignore and committed the lock file.

**Reasoning:** GitHub Actions needs lock file to install exact versions.

---

### 🐛 README Inaccuracies

**Issue:** README had incorrect specs (default size wrong, heart flight distance wrong).

**User Request:** "I needed to analyze the project, see what features are actually available, and then make sure the Readme matches that and not just matches the context that's available on this chat."

**Solution:** Ran code audit via multi-agent workflow, verified actual values, corrected README.

**Approach:** 
- Didn't trust the chat context
- Actually read the code
- Measured actual behavior
- Updated docs to match reality

---

## Deployment & CI/CD Decisions

### ✅ GitHub Actions for Automated Deployment

**Decision:** Use GitHub Actions workflow to build and deploy on every push to main.

**Workflow:**
1. Trigger on push to main
2. Run `npm ci` (clean install)
3. Run `npm run build`
4. Deploy `dist/` to GitHub Pages

**Why:**
- Zero-friction deployment
- No manual steps
- Prevents forgetting to build
- Automatic on every merge

**Why Not:**
- Netlify/Vercel: GitHub Pages sufficient
- Manual deployment: error-prone

---

### ✅ Base Path Configuration

**Decision:** `vite.config.js` sets `base: '/unfortunately/'` for GitHub Pages.

**Why:** Repository deployed to GitHub Pages at `/unfortunately/`, not root domain

---

## Design Trade-offs & Known Limitations

### ✅ Squash Animation on Bounce vs More Complex Physics

**Trade-off:** Using simple CSS squash animation (65ms + 95ms) instead of complex deformation.

**Why:** Good enough for gameplay, easy to tweak, doesn't require complex physics calculation

---

### ✅ Random Wander Overridable by Food

**Decision:** When food lands, monster abandons wander and pursues.

**Why:** Food is higher priority; makes feeding mechanic feel responsive

---

### ✅ No Acceleration/Deceleration on Monster Movement

**Decision:** Monster hops at fixed distance/time, no easing ramps.

**Why:** Simpler to implement, feels snappy enough

---

### ✅ Gloss Highlight Not Parallax

**Decision:** Gloss doesn't parallax with blob depth; always at surface.

**Why:** Keeps it simple, looks fine

---

## Lessons & Principles Adopted

### ✅ No Over-Engineering for Future Features

**Principle:** Build what's needed now. Don't architect for features you might add later.

**Examples:**
- Not scoping localStorage by pet ID (multiple pets might happen, but not now)
- Not building progression system (might add stats later, but don't over-prepare)
- Not adding hooks for backend integration (no backend planned)

---

### ✅ AI-Friendly Code Is Future-Proof

**Principle:** Code readable by AI agents is also readable by humans.

**Implications:**
- Clear naming helps both humans and AI
- Comments for "why" help both
- One-liner headers help both
- Consistent patterns help both

---

### ✅ Prefer Shipped Over Perfect

**Principle:** Shipped game with acceptable physics beats unshipped game with perfect physics.

**Examples:**
- Physics is "good enough POC" not mathematically perfect
- Code is somewhat messy (user admitted) but works
- Accepted tradeoffs for speed

---

### ✅ Measure Actual Behavior, Don't Trust Context

**Principle:** When accuracy matters, read the code and test, don't trust the spec/chat.

**Example:** README audit — user wanted actual measured values, not assumed values

---

## Summary of Major Decisions

| Category | Decision | Status |
|----------|----------|--------|
| **Architecture** | Front-end only, no backend | ✅ Locked |
| **Tech Stack** | React + Vite | ✅ Locked |
| **Persistence** | localStorage only | ✅ Locked |
| **Blob Shape** | Cubic bezier path (finalized) | ✅ Locked |
| **Blob Colors** | HSL derived from single hue | ✅ Locked |
| **Eyes** | Pure black, not hue-based | ✅ Locked |
| **Size** | Starts 0.5, grows +0.04, no cap | ✅ Locked |
| **Physics** | COR=0.65, gravity fade, temporary | ✅ Accepted POC |
| **Movement** | 90px hops, 180px arrival threshold | ✅ Locked (for now) |
| **Celebration** | Every eat, same animation | ✅ Locked (for now) |
| **Petting** | Hold and rub; motion-gated | ✅ Shipped |
| **Color Picker** | Settings button, hue slider | ✅ Shipped |
| **Mobile** | Pointer events throughout, responsive layout | ✅ Shipped |
| **Squashing** | Blob squashes at screen edges | 🚧 Planned |
| **Multiple Pets** | Not now, might later | ❌ Rejected (for now) |
| **Stats/Progression** | Not planned | ❌ Rejected |
| **Backend Features** | Explicitly excluded | ❌ Rejected |
| **Analytics** | Not planned | ❌ Rejected |

