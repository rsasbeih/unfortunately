# unfortunately — Complete Specification

## Project Vision

**unfortunately** is a front-end only pet simulator game. No backend, no server, no dependencies beyond React and Vite. Users can open it, feed their blob monster, watch it grow, and close it — all persistence lives in browser localStorage.

The meta-goal: prove you can build a complete game loop entirely in the frontend, and open-source it so others can fork it, modify it, and add the features they want.

## Core Design Principles

1. **Front-End Only** — No backend, no API calls, no server-side state. Everything is local.
2. **AI-Friendly Code** — Code should be readable by both humans and AI agents. Clear naming, "why" comments, one-liner file headers.
3. **No Over-Engineering** — Build what's needed now. Refactor when needed. Don't architect for features we might add later.
4. **Open Source** — Accessible for contributors to understand, fork, and extend.

---

## Game Loop

```
1. User opens app → blob appears at random position with persisted color and size
2. User drags to aim a paper ball and releases to throw
3. Ball bounces across screen with physics-based gravity fade
4. Monster pursues ball when it lands
5. Monster eats ball → eating animation, monster grows +0.04 size
6. Celebration animation (jumps + hearts) plays
7. Monster returns to idle wandering
8. Repeat or pet blob for extra happiness
```

---

## Features

### ✅ Implemented

#### 1. Blob Monster

**Appearance:**
- Pure SVG, single `<path>` with cubic bezier curves (no ellipses, one continuous shape)
- **Path:** `M 100,25 C 148,22 192,62 194,108 C 196,148 168,178 100,180 C 32,178 4,148 6,108 C 8,62 52,22 100,25 Z`
- **Silhouette:** Intentionally squatter (wider than tall) to match jello/slime aesthetic
- **SVG Base Size:** 200×200px (all internal coordinates relative to this)
- **Display Size:** `200 * monsterSize` pixels; starts at 0.5 (100×100px), grows infinitely

**Colors (HSL-derived from single hue value 0–359):**
- **Body Light:** `hsl(hue, 72%, 91%)`
- **Body Mid:** `hsl(hue, 55%, 67%)`
- **Body Dark:** `hsl(hue, 55%, 45%)`
- **Glow (Belly):** `hsl((hue+20)%360, 80%, 62%)` — hue shifted for "light from below" feel
- **Gloss (Highlight):** `hsl(hue, 65%, 95%)` — pale version of hue, NOT white
- **Eyes:** Pure black `#000`, immune to hue changes (always professional)
- **Gloss Position:** Tracks fixed light source at screen top-center; moves as monster moves

**Highlights:**
- Two-layer gloss highlight in upper-left: large soft halo + tight bright core
- Gloss clips to body silhouette via `clipPath="url(#bodyClip)"` so blur never bleeds
- Subtle belly glow at base
- Drop shadow ellipse below body

**Growth:**
- Grows +0.04 size per eat
- No cap on growth — grows infinitely
- When blob exceeds screen bounds, visually squashes/gets squeezed by edges (gradient implementation TBD: gradual vs snap)
- Size persisted to localStorage as `monsterSize`; minimum valid size 0.5 (ignores stale values)

#### 2. Ball Physics & Throwing

**Throwing Mechanic:**
- User drags to aim and releases to throw
- Minimum throw velocity: 0.25px/ms (else ball drops in place)
- Initial velocity scaled ×3 before simulation enters

**Physics:**
- **Gravity:** 0.5 px/frame², fades to 0 over 4 bounces (normalized: `1 - bounceCount/4`)
- **Friction:** 0.99–0.97 (tightens as bounces increase: `0.99 - (bounceCount/4) * 0.02`)
- **COR (Coefficient of Restitution):** 0.65 on all surfaces (walls, ceiling, floor)
- **Wall Bounces:** Additional dampen horizontal velocity by ×0.9
- **Physics Sleep:** When `hypot(vx, vy) < 0.4` px/frame (pure speed threshold, no frame counter)
- **Squash on Impact:** 65ms squash + 95ms return (±0.28 scale, flipped for floor vs walls)

**Design Note:** Current physics is a proof-of-concept (user-accepted temporary solution). May be refined later, but user likes current behavior.

#### 3. Monster Movement

**Wandering:**
- 90px hops (`STEP = 90`)
- 280ms flight time (`HOP_MS = 280`)
- 980ms total cycle (flight + jello recovery; same CSS keyframe)
- Arc peak at 13% of cycle (126ms)
- Landing at 29% of cycle (280ms)
- Random wander pauses between 1.5–3.5s between hops
- 30% chance to smile when reaching wander destination (1500ms smile duration)

**Food Pursuit:**
- When food lands on screen, monster overrides wander and pursues
- Arrival threshold: 180px (STEP × 2.0) — accounts for edge-clamping at size=1.0
- Triggers eating animation on arrival

**Constraints:**
- Monster never goes off-screen (clamped to playable area)
- Monster center: `monsterPos.x + 100 * monsterSize`

#### 4. Eating Animation

**Timeline:**
- Ball travels to monster center over 280ms (ease-in quad)
- 5 suction particles drift inward during travel
- White radial flash at absorption (90ms, centered at 300ms mark)
- 16 particles burst outward (150ms, ease-out quad)
- Particles converge back inward (420ms, ease-in cubic, shrinking + fading)
- Total duration ~800ms

**Implementation:**
- Canvas overlay for particle effects (avoids per-element DOM overhead)
- Monster grows +0.04 size on completion
- No size cap

#### 5. Celebration Animation

**Trigger:** Every time monster finishes eating

**Sequence:**
- 3 joy jumps over ~3.5s total (700ms spacing: at 0ms, 700ms, 1400ms, 2100ms)
- Monster smiles during jumps
- 3 heart bursts, one per jump (12 total hearts: initial burst + 3 jumps × 3 hearts)
  - Hearts arranged radially around monster center
  - Center heart at y-offset -30px, side hearts at -15px
  - Each burst has 3 hearts with staggered 20ms delays
  - Hearts rise 180px and fade over 3s (ease-out motion)
  - Slight random horizontal drift (±20px)

#### 6. Color Persistence

- **Key:** `monsterHue` (0–359)
- **Behavior:** Random on first visit, same color every reload after
- **Initialization:** Uses `useState` initializer to generate random hue once per component mount, saves to localStorage

#### 7. Size Persistence

- **Key:** `monsterSize`
- **Default:** 0.5 (small enough to see features, large enough to look intentional)
- **Behavior:** Persists across reloads, grows on eat, no cap
- **Validation:** Accepts any valid parsed number >= 0.5 from localStorage; defaults to 0.5 if missing/invalid

---

### 🚧 Planned (In Priority Order)

#### 1. Petting Mechanic

**Feature:** User can pet blob to trigger a happy expression without feeding

**Desktop Interaction:**
- Click on blob → starts petting animation
- Multiple clicks continue petting
- Triggers different happy expression (distinct from eating-happy)

**Mobile Interaction:**
- Long-press on blob → starts petting animation
- Drag while holding to continue petting

**Implementation:**
- New animation state: "petting"
- Different facial expression during petting vs eating
- Haptic feedback on mobile (optional future enhancement)

#### 2. Color Picker (Settings)

**UI:**
- Settings button in top-right corner
- Opens color picker modal/overlay (game continues running)
- Simple hue slider (0–359) or color input

**Behavior:**
- User selects or inputs hue value
- App immediately recalculates all blob colors from that hue
- New hue saves to localStorage (overwrites old value, no history needed)
- Optional: preset color palette for quick selection

**Implementation:**
- Settings button component
- Color picker component
- Real-time color preview on blob

#### 3. Mobile Optimization

**Current Issues:**
- Not touch-friendly for throwing mechanic
- UI elements may be too small on mobile
- Scaling/responsiveness untested

**Changes Needed:**
- Touch-drag throwing (replace mouse drag, or support both)
- Responsive layout for small screens
- Test on various mobile devices

**Design Decision:** Blob size stays at 0.5 default (don't shrink for mobile)

#### 4. Blob Squashing at Screen Edges

**Visual Effect:** When blob grows so large it exceeds screen bounds, it visibly squashes/gets squeezed by the four edges

**Implementation Details:**
- Detect when blob size exceeds screen bounds
- Apply visual squash animation or CSS transform
- Design decision pending: gradual squeeze vs snap to max size

---

### 💡 Future Considerations (No Implementation Yet)

#### Multiple Pets (Cool idea, but not now)
- User grows one blob big enough, it "goes into the world" (background)
- Can spawn new baby blob and start over
- See all grown blobs in background
- **Decision:** Don't architect for this now. Refactor when/if we build it.

#### Additional Expressions/States
- **Sleepy:** TBD — unclear what triggers this or when/if it's needed
- **Other States:** Could add for future gameplay mechanics (sadness, confusion, etc.)
- **Trigger:** Events, never random (except 30% smile chance)

#### Stats & Progression
- Currently undecided if pet simulator needs stats (hunger, happiness, health, etc.)
- Kept simple for now: blob just likes to eat, never requires feeding
- Open to revisiting

#### Backend Features
- **Explicitly Excluded:** No multi-user, cloud save, leaderboards, social features
- Reason: Defeats "front-end only" core principle
- Contributors can fork and add backend if they want

---

## Technical Architecture

### Stack
- **Framework:** React 18+
- **Build Tool:** Vite
- **Styling:** CSS (no CSS-in-JS framework)
- **Graphics:** Pure SVG for blob, Canvas for particles
- **Persistence:** Browser localStorage only
- **Deployment:** GitHub Pages

### File Structure

```
src/
├── App.jsx                      # Main app state, celebration logic
├── App.css
├── MonsterHop.jsx               # Blob rendering, movement, animations
├── Monster.css
├── feeding/
│   ├── FeedingMechanic.jsx      # Ball throwing UI and state management
│   ├── ProjectileBall.jsx       # Ball physics simulation
│   ├── CrumpledBall.jsx         # Ball visual representation
│   ├── EatAnimation.jsx         # Eating animation + particles
│   ├── CreaseLines.jsx          # Shared SVG crease pattern component
│   └── feeding.css
├── constants/
│   ├── sizes.js                 # SVG_BASE_SIZE = 200
│   ├── paperPhase.js            # Ball state phases (IDLE, COMPOSING, THROWING, LANDED, BEING_EATEN)
│   ├── eatPhases.js             # Eating animation phases (NONE, GULP, SHIMMY)
│   └── colors.js                # Color constants (BALL_LIGHT, PAPER_LIGHT, etc.)
└── index.css
```

### State Management

**App.jsx (Parent State):**
- `feedPhase` — current phase of ball lifecycle
- `monsterPos` — monster x/y position
- `foodLandPos` — where ball landed (null if in air)
- `monsterSize` — current blob size (persisted)
- `isCelebrating` — celebration animation active
- `celebrationBurst` — which burst number (0–4)

**MonsterHop.jsx (Component State):**
- `hue` — current color (persisted via localStorage, initialized once in useState)
- `pos` — monster position (synced with parent)
- `isSmiling` — smile expression active
- `hopKey` — animation trigger key
- `eatPhase` — eating animation state
- `celebrationJumpsLeft` — jumps remaining in celebration

**FeedingMechanic.jsx (Component State):**
- `feedPhase` — ball state (synced with parent)
- Ball position, velocity, bounce count during flight

### Constants

**Sizes:**
- `SVG_BASE_SIZE = 200` — blob internal coordinates

**Monster Movement:**
- `STEP = 90` — hop distance (px)
- `ARC_H = 18` — hop arc height (px)
- `HOP_MS = 280` — hop flight time (ms)
- `TOTAL_MS = 980` — full hop cycle including recovery (ms)
- `MARGIN = 50` — edge padding to keep monster on screen (px)

**Ball Physics:**
- `GRAVITY = 0.5` — initial gravity (px/frame²)
- `FRICTION_START = 0.99` — initial friction
- `COR = 0.65` — coefficient of restitution
- `SLEEP_THRESHOLD = 0.4` — speed to consider ball at rest (px/frame)
- `THROW_MIN_VEL = 0.25` — minimum velocity to throw (px/ms)

**Eating Animation:**
- Ball travel: 280ms (ease-in quad)
- White flash: 90ms (at 300ms mark)
- Particle burst: 150ms (ease-out quad)
- Particle converge: 420ms (ease-in cubic)
- Total: ~800ms
- Monster growth: +0.04 size

**Celebration:**
- Jump spacing: 700ms
- Total duration: 3500ms
- Hearts per burst: 3
- Total hearts: 12
- Flight height: 180px
- Flight duration: 3s

---

## Code Quality Standards

### AI-Friendly Guidelines

To make code readable by both humans and AI agents (for contributing/extending):

1. **File Headers:** Every `.jsx` and `.js` file starts with a JSDoc one-liner describing its purpose
   ```js
   /** Renders the blob monster with SVG, handles position and eating animations. */
   export default function MonsterHop({ ... }) { ... }
   ```

2. **Naming Conventions:**
   - No abbreviations unless unavoidable
   - Functions describe action (e.g., `updatePosition`, `triggerEating`, not `upPos`, `eat`)
   - Constants in UPPER_SNAKE_CASE
   - Component state descriptive (e.g., `isCelebrating`, not `cel`)

3. **Comments:**
   - Comments explain **why**, not **what**
   - Code itself should be clear enough to explain what it does
   - Use comments for non-obvious constraints, workarounds, or performance notes

4. **Code Patterns:**
   - Keep components focused: one responsibility per component
   - useRef for mutable references, useState for component state
   - useEffect for side effects with clear dependency arrays
   - Avoid deeply nested logic; extract helper functions

5. **Imports & Organization:**
   - Group React imports first
   - Then local imports (constants, components)
   - Keep imports alphabetical within groups

### No Over-Engineering

- **Single Responsibility:** A component or function does one thing well
- **DRY but Not Premature:** Extract duplication when it exists, not when it might exist
- **Minimal Dependencies:** Prefer simple over clever
- **Local State:** Keep state as close to usage as possible

---

## Persistence Layer

### localStorage Keys

| Key | Type | Default | Format | Notes |
|-----|------|---------|--------|-------|
| `monsterHue` | number | random (0–359) | string (parsed as int) | Regenerated on first visit, random each new browser/incognito |
| `monsterSize` | number | 0.5 | string (parsed as float) | Grows on eat, no cap, minimum 0.5 |

### Initialization

**On First Load:**
1. `monsterHue` missing → generate random 0–359, save to localStorage
2. `monsterSize` missing → default to 0.5

**On Reload:**
1. Read `monsterHue` from localStorage → use it
2. Read `monsterSize` from localStorage → use it (or default to 0.5 if invalid)

**In Incognito/Private Mode:**
- Separate localStorage instance per window
- First visit: random color, size 0.5
- On close: all data cleared (browser default)

---

## Interaction Flows

### Feed the Blob (Current)

```
1. User drags from any point on screen
2. Visual feedback: aim indicator (TBD visual)
3. User releases → throw
4. Ball flies with physics
5. Ball bounces and settles on screen
6. Monster pursues ball (overrides wander)
7. Monster arrives at ball → eating animation
8. Monster grows, celebration plays
9. Monster returns to wandering
```

### Pet the Blob (Planned)

```
Desktop:
1. User clicks on blob
2. Petting animation plays + happy expression
3. User can click again to continue petting
4. Petting effect fades

Mobile:
1. User long-presses on blob
2. Petting animation plays + happy expression
3. User drags while holding to continue petting
4. Petting effect fades on release
```

### Change Color (Planned)

```
1. User clicks settings button (top-right)
2. Color picker modal opens (game continues)
3. User adjusts hue slider or picks from palette
4. Blob color updates in real-time
5. User closes picker
6. New hue saved to localStorage
```

---

## Browsers & Compatibility

- **Target:** Modern browsers (Chrome, Firefox, Safari, Edge)
- **Minimum:** ES2020 (no IE11 support)
- **CSS Features:** CSS Grid/Flex, CSS Animations, CSS Filters
- **Canvas API:** For particle rendering
- **localStorage:** Required (no fallback for private mode)

---

## Performance Considerations

### Current Optimizations

- **Canvas Particles:** Eating animation uses canvas overlay instead of DOM elements (faster for ~16 particles)
- **CSS Keyframes:** All animations use CSS (GPU-accelerated)
- **Single SVG Path:** Blob is one path element, not multiple shapes
- **ClipPath:** Gloss/glow clips to body boundary (prevents blur overflow)

### Potential Bottlenecks

- **Physics Simulation:** Ball physics runs per-frame (~60fps); could be optimized if performance degrades
- **Monster Wandering:** Random position calc on every wander; negligible cost
- **Re-renders:** React state changes trigger re-renders; should be minimal with proper hooks

---

## Testing & QA

### Current Approach

- Automated regression suite: `npm run test:regression` (`qa/regression.mjs`), headless Playwright, 14 assertions, exits non-zero on failure. Requires `npm run dev` running
- Covers: boot, color picker → blob repaint, the full throw → settle → pursue → eat → grow chain, persistence across reload, console errors
- Run it after every feature, and add a case for whatever the feature added
- Animation feel (timing, easing, juice) is still checked by eye — the suite deliberately asserts on durable state, not frame-level timing, so it stays non-flaky

### Suggested QA Checklist

- [ ] Ball throws correctly with drag mechanic
- [ ] Ball bounces and settles naturally
- [ ] Monster pursues food and eats
- [ ] Size persists across page reload
- [ ] Color persists across page reload
- [ ] Celebration animation plays completely
- [ ] Mobile touch works (when implemented)
- [ ] Petting mechanic works (when implemented)
- [ ] Color picker updates blob (when implemented)

---

## Known Issues & Workarounds

| Issue | Status | Workaround | Notes |
|-------|--------|-----------|-------|
| Ball physics feels temporary | Accepted | User likes current behavior | May refactor later, not urgent |
| Mobile not fully optimized | Planned | Implementing touch controls | In progress |
| Code needs AI-friendliness pass | In Progress | Adding file headers, better naming | Current sprint |

---

## Deployment

### GitHub Pages

- **URL:** https://github.com/rsasbeih/unfortunately
- **Build:** GitHub Actions workflow (`deploy.yml`)
  - Triggers on push to `main`
  - Runs `npm ci && npm run build`
  - Deploys `dist/` to GitHub Pages
- **Base Path:** `/` (configured in `vite.config.js`) — the site is served from the apex of a custom domain, so assets resolve at the root. Preview builds override this with `--base` on the command line
- **Custom Domain:** Not yet

### Future Deployment

- Standalone Electron app (optional, not planned yet)
- Progressive Web App (PWA) support (optional, not planned yet)

---

## Contributing Guidelines

### For AI Agents

1. Read the one-liner file header to understand component purpose
2. Review state management pattern in App.jsx or component
3. Follow existing naming/structure conventions
4. Add "why" comments for non-obvious logic
5. Test changes with manual interaction (if possible)

### For Human Contributors

1. Fork the repo
2. Understand the game loop (read CLAUDE.md + SPEC.md)
3. Pick a feature from "Planned" or propose your own
4. Keep it front-end only (no backend)
5. Follow code style (clear names, why comments, one-liner headers)
6. Test before submitting PR

---

## Glossary

| Term | Definition |
|------|-----------|
| **Blob/Monster** | The main playable character; SVG-rendered jello-like creature |
| **Hue** | Color value (0–359 on HSL scale); single value from which all blob colors are derived |
| **HSL** | Hue, Saturation, Lightness; color model used for blob palette |
| **COR** | Coefficient of Restitution; how much velocity ball retains after bounce (0.65 = 65%) |
| **Physics Sleep** | Threshold at which ball is considered settled/at rest |
| **Wander** | Monster's random movement when not pursuing food |
| **Pursuit** | Monster's targeted movement toward food |
| **Celebration** | Post-eating animation with jumps and hearts |
| **Petting** | User interaction to make blob happy without feeding (planned) |
| **Squashing** | Visual compression effect when blob exceeds screen bounds (planned) |

---

## Version History

- **v0.1** (Current) — Initial playable MVP with feeding, growth, persistence, celebration
- Future versions TBD based on contributions and user requests

