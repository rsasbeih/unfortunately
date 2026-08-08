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

- 🫧 **the blob** — hue-based colors, gloss highlights, belly glow. it's soft. give it a name.
- 🎯 **feeding mechanic** — drag to aim, release to throw. the ball bounces *everywhere*. gravity fades over bounces. physics is weirdly accurate.
- 🦘 **monster hopping** — random wandering with a 980ms hop cycle. pursues food when you throw it.
- 💕 **celebration** — after eating, 3 jumps with hearts floating up. yes, there are hearts. yes, it matters.
- 📊 **persistence** — color and size saved to localStorage. your monster remembers you.
- ✨ **eating animation** — particle burst with converge-inward chaos-to-order vibes. designed for maximum satisfaction.

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
- gravity fades from 0.5 px/frame² to 0 over 4 bounces
- friction tightens from 0.99 to 0.97 as gravity fades
- COR (coefficient of restitution) = 0.65 on all surfaces
- lands via physics sleep (speed < 0.4 px/frame for 20 frames), not hard floor detection
- includes squash animation on impact (the "juice")

### monster movement
- wanders randomly with 90px hops
- 280ms flight time, 980ms total cycle (hop + jello recovery)
- pursues food when it lands
- 180px arrival threshold (handles edge cases at size 1.0)

### colors
- all derived from single hue value (0-359)
- HSL-based: light/mid/dark body stops, gloss tint, belly glow (+20° hue shift)
- stored in localStorage as `monsterHue`

### eating animation
- ball travels to monster center (280ms, ease-in quad)
- 5 suction particles drift inward
- white radial flash at absorption (90ms)
- 16 particles burst outward then converge inward (420ms, ease-in cubic)
- total: ~800ms, monster grows +0.04 size (no cap, grows infinitely)

## size & scale

- default SVG size: 200×200px (configurable via `monsterSize` multiplier)
- monster center: `monsterPos.x + 100*monsterSize`
- all coordinates stable via viewBox (doesn't scale with DOM size)

## known quirks

- the blob is intentionally squatter (wider than tall) to match jello reference
- eyes are pure black, immune to hue changes (they're professional like that)
- hearts follow a straight upward path with slight horizontal drift (s-curve was weird)
- size has no cap because chaos is fun

## made with

- too much CSS keyframe tuning
- research into game juice & GDC talks
- a suspicious amount of time thinking about blob physics
- [Playwright](https://playwright.dev) for QA screenshots

## license

MIT (do whatever, just keep the jello vibe alive)

---

**tip:** if your blob gets too big, just clear localStorage and start fresh. no judgment. 💕
