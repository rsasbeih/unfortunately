# 🫧 unfortunately

a weirdly charming blob monster that you feed & watch it grow. built with react, vite, and an embarrassing amount of love for jello.

## what is this

you throw crumpled paper at a blobby friend. it eats it. it gets bigger. hearts float up. there's way too much physics for something that jiggles. it's supposed to be a pet simulator but honestly it's just vibes.

## the stack

- **react** — for making things interactive (and making them jiggly)
- **vite** — because webpack is so 2019
- **svg** — pure bezier curves, no sprite sheets, no shame
- **css keyframes** — for that perfect squish animation
- **physics** — gravity fade, coefficient of restitution, sleep thresholds (it's not just random bouncing, i promise)

## features that exist

- 🫧 **the blob** — hue-based colors (HSL), gloss highlights that track screen lighting, belly glow. it's soft. give it a name.
- 🎯 **feeding mechanic** — drag to aim, release to throw. ball bounces everywhere with physics-based gravity fade. needs 0.25px/ms threshold to actually throw (else it drops).
- 🦘 **monster hopping** — 90px hops every 980ms total (280ms flight + 700ms jello recovery). random wandering between 1.5–3.5s pauses. pursues food when it lands.
- 💕 **celebration** — after eating, 3 joy jumps (700ms apart) with the monster smiling. 12 hearts total across 4 bursts (at 0, 700, 1400, 2100ms). hearts rise 180px over 3 seconds.
- 📊 **persistence** — color (hue 0–359) and size (0.5 default) saved to localStorage. your monster remembers you.
- ✨ **eating animation** — 5 suction particles drift in, white flash, then 16 particles burst outward and converge inward. total ~800ms of satisfaction.

## getting started

```bash
npm install
npm run dev
```

then open [http://localhost:5173](http://localhost:5173) and throw paper at a blob.

## how to feed your unfortunate friend

1. click the feed button (bottom right)
2. type something (the stamp requires text, very responsible)
3. click the stamp to crumple
4. drag the blob around to aim, release to throw
5. watch it bounce
6. watch the monster chase it
7. watch the blob eat with satisfaction
8. watch it grow
9. repeat until your blob is unreasonably large

## technical deep dive (if you care)

### ball physics
- gravity = 0.5 px/frame², fades to 0 over 4 bounces (normalized: `1 - bounceCount/4`)
- friction = 0.99–0.97 (tightens as bounces increase via `0.99 - (bounceCount/4) * 0.02`)
- COR (coefficient of restitution) = 0.65 on all surfaces (walls, ceiling, floor)
- wall bounces additionally dampen horizontal velocity by ×0.9
- lands via physics sleep: when `hypot(vx, vy) < 0.4` px/frame (pure speed threshold, no frame counter)
- initial velocity scaled ×3 before simulation
- squash on impact: 65ms squash + 95ms return (±0.28 scale on axes, flipped for floor vs walls)

### monster movement
- wanders randomly with 90px hops, 1500–3500ms pauses between wanders
- 280ms flight time, 980ms total cycle (includes jello recovery/wobble)
- arc peak at 13% (126ms), landing at 29% of cycle
- pursues food when it lands (overrides wander)
- arrival thresholds: 180px for food (STEP × 2.0), 81px for wander destinations (STEP × 0.9)
- smiles 30% of the time when reaching destinations (1500ms smile duration)

### colors
- all derived from single hue value (0–359), default = 200
- body light: `hsl(hue, 72%, 91%)`
- body mid: `hsl(hue, 55%, 67%)`
- body dark: `hsl(hue, 55%, 45%)`
- glow color: `hsl(hue+20, 80%, 62%)` (belly glow, hue shifted for "light from below" feel)
- gloss color: `hsl(hue, 65%, 95%)` (pale version of hue, not white)
- gloss position tracks fixed light source at screen top-center
- stored in localStorage as `monsterHue` (persists across visits)


## made with

- too much CSS keyframe tuning
- research into game juice & GDC talks
- a suspicious amount of time thinking about blob physics
- [Playwright](https://playwright.dev) for QA screenshots

## license

MIT (do whatever, just keep the jello vibe alive)

---
