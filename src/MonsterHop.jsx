import { useState, useEffect, useRef } from "react";
import { EatPhase } from "./constants/eatPhases";
import { SVG_BASE_SIZE } from "./constants/sizes";
import { BLUSH_COLOR } from "./constants/colors";
import {
  PET_LEAN_WIDTH_RATIO,
  PET_LEAN_DAMPING,
  PET_LEAN_SKEW_DEG,
  PET_PRESS_SQUASH,
  PET_MOTION_WINDOW_MS,
  PET_SHIMMY_MS,
  PET_SHIMMY_SHIFT_PCT,
  PET_SHIMMY_SQUASH,
  PET_BLUSH_FADE_MS,
  PET_EXPRESSION_HOLD_MS,
  PET_LINGER_MS,
} from "./constants/petting";

const STEP     = 90;
const ARC_H    = 18;
const HOP_MS   = 280;   // time blob is in the air
const TOTAL_MS = 980;   // hop + jello recovery (same keyframe)
const MARGIN   = 50;

// Arc peak is at 45% of HOP_MS = 126ms → 126/980 ≈ 13% of TOTAL_MS
// Landing is at 100% of HOP_MS = 280ms → 280/980 ≈ 29% of TOTAL_MS
const STYLES = `
@keyframes mhHop {
  0%   { transform: translateY(0)        scaleX(1)    scaleY(1); }
  13%  { transform: translateY(-${ARC_H}px) scaleX(0.82) scaleY(1.18); }
  29%  { transform: translateY(0)        scaleX(1.22) scaleY(0.84); }
  40%  { transform: translateY(0) scaleX(0.87) scaleY(1.13); }
  52%  { transform: translateY(0) scaleX(1.05) scaleY(0.97); }
  64%  { transform: translateY(0) scaleX(0.98) scaleY(1.02); }
  76%  { transform: translateY(0) scaleX(1.01) scaleY(0.99); }
  88%  { transform: translateY(0) scaleX(0.99) scaleY(1.01); }
  100% { transform: none; }
}
.mh-hop { animation: mhHop ${TOTAL_MS}ms ease-in-out; }

@keyframes mhShadow {
  0%   { transform: scale(1);    opacity: 1; }
  13%  { transform: scale(0.38); opacity: 0.28; }
  29%  { transform: scale(1.32); opacity: 0.88; }
  45%  { transform: scale(0.88); opacity: 1; }
  62%  { transform: scale(1.06); opacity: 1; }
  78%  { transform: scale(0.98); opacity: 1; }
  90%  { transform: scale(1.01); opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
}
.mh-shadow { animation: mhShadow ${TOTAL_MS}ms ease-in-out; }

@keyframes mhGulp {
  0%   { transform: scaleX(1)    scaleY(1); }
  20%  { transform: scaleX(0.88) scaleY(1.25); }
  50%  { transform: scaleX(1.15) scaleY(0.85); }
  70%  { transform: scaleX(0.96) scaleY(1.08); }
  100% { transform: scaleX(1)    scaleY(1); }
}

@keyframes mhShimmy {
  0%   { transform: scaleX(1)    scaleY(1); }
  15%  { transform: scaleX(1.08) scaleY(0.96); }
  35%  { transform: scaleX(0.95) scaleY(1.04); }
  55%  { transform: scaleX(1.04) scaleY(0.98); }
  75%  { transform: scaleX(0.98) scaleY(1.02); }
  100% { transform: scaleX(1)    scaleY(1); }
}

.mh-gulp   { animation: mhGulp   600ms ease-in-out forwards; }
.mh-shimmy { animation: mhShimmy 500ms ease-in-out forwards; }

/* Petting shimmy. Shift is a percentage of the blob's own width, so it scales
   with the body without any size math. */
@keyframes mhPetShimmy {
  0%   { transform: translateX(0)                          scaleX(1); }
  25%  { transform: translateX(${PET_SHIMMY_SHIFT_PCT}%)   scaleX(${1 - PET_SHIMMY_SQUASH}); }
  50%  { transform: translateX(0)                          scaleX(1); }
  75%  { transform: translateX(-${PET_SHIMMY_SHIFT_PCT}%)  scaleX(${1 + PET_SHIMMY_SQUASH}); }
  100% { transform: translateX(0)                          scaleX(1); }
}
.mh-pet-shimmy { animation: mhPetShimmy ${PET_SHIMMY_MS}ms ease-in-out infinite; }

.mh-blush { transition: opacity ${PET_BLUSH_FADE_MS}ms ease; }
`;

export default function MonsterHop({
  size           = 1.0,
  hue            = 0,
  onPosChange    = null,
  foodTarget     = null,
  onFoodArrived  = null,
  isEating       = false,
  isCelebrating  = false,
  canPet         = true,
  onEatComplete  = null,
}) {
  const svgPx = SVG_BASE_SIZE * size;

  const bodyLight  = `hsl(${hue}, 72%, 91%)`;
  const bodyMid    = `hsl(${hue}, 55%, 67%)`;
  const bodyDark   = `hsl(${hue}, 55%, 45%)`;
  const glowColor  = `hsl(${(hue + 20) % 360}, 80%, 62%)`;
  const glossColor = `hsl(${hue}, 65%, 95%)`;

  const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const randPos = () => ({
    x: MARGIN + Math.random() * (window.innerWidth  - svgPx - MARGIN * 2),
    y: MARGIN + Math.random() * (window.innerHeight - svgPx - MARGIN * 2),
  });

  const [pos,          setPos]          = useState(() => randPos());
  const [isSmiling,    setIsSmiling]    = useState(false);
  const [eyeShift,     setEyeShift]     = useState(0);
  const [hopKey,       setHopKey]       = useState(0);
  const [eatPhase,     setEatPhase]     = useState(EatPhase.NONE);
  const [eatKey,       setEatKey]       = useState(0);
  const [celebrationJumpsLeft, setCelebrationJumpsLeft] = useState(0);
  const [isRubbing,    setIsRubbing]    = useState(false); // pointer down AND recently moved
  const [isPleased,    setIsPleased]    = useState(false); // squint + blush; outlasts the rub

  const leanRef        = useRef(null); // the layer the lean transform is written to
  const isPettingRef   = useRef(false);
  const lastMoveAtRef  = useRef(0);
  const leanRafRef     = useRef(null);
  const leanRef_value  = useRef(0);    // current lean, chases targetLeanRef
  const targetLeanRef  = useRef(0);    // -1..1, where the pointer sits across the body
  const pleasedTimerRef = useRef(null);

  const timers        = useRef([]);
  const isPaused      = useRef(false);
  const foodTargetRef = useRef(foodTarget);
  const posRef        = useRef(pos); // always mirrors pos; lets effects read current pos without updater trick

  const tick = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  const clearAllTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Keep ref in sync so doHopSequence closure can read current foodTarget
  useEffect(() => {
    foodTargetRef.current = foodTarget;
  }, [foodTarget]);

  // Report position changes to parent
  const updatePos = (newPos) => {
    posRef.current = newPos;
    setPos(newPos);
    if (onPosChange) onPosChange(newPos);
  };

  const doHopSequence = (cur, dest) => {
    if (isPaused.current) return;

    // If there's a food target, override destination
    const ft = foodTargetRef.current;
    const actualDest = ft || dest;

    // Compare monster CENTER to food target (ball center) for accurate proximity
    const monsterCX = cur.x + svgPx / 2;
    const monsterCY = cur.y + svgPx / 2;
    const dx   = actualDest.x - monsterCX;
    const dy   = actualDest.y - monsterCY;
    const dist = Math.hypot(dx, dy);

    // For food: 2.0 hops covers the worst-case gap when the large monster is clamped at the
    // screen edge but food settled near a corner (~152px max at 1200×750 with size=1.0).
    // For random wander: arrive when within normal hop distance.
    const arrivalDist = ft ? STEP * 2.0 : STEP * 0.9;

    if (dist < arrivalDist) {
      setEyeShift(0);

      // If we arrived at a food target, notify parent
      if (ft && onFoodArrived) {
        onFoodArrived();
        return; // parent will set isEating=true, we pause hopping
      }

      const smile = Math.random() < 0.3;
      if (smile) {
        tick(() => {
          setIsSmiling(true);
          tick(() => {
            setIsSmiling(false);
            tick(() => doHopSequence(cur, randPos()), 400);
          }, 1500);
        }, 500);
      } else {
        tick(() => doHopSequence(cur, randPos()), 1500 + Math.random() * 2000);
      }
      return;
    }

    const next = {
      x: clamp(cur.x + (dx / dist) * STEP, MARGIN, window.innerWidth  - svgPx - MARGIN),
      y: clamp(cur.y + (dy / dist) * STEP, MARGIN, window.innerHeight - svgPx - MARGIN),
    };

    setEyeShift(Math.sign(dx) * 4);
    setHopKey(k => k + 1);
    updatePos(next);

    tick(() => {
      tick(() => doHopSequence(next, actualDest), 60 + Math.random() * 40);
    }, HOP_MS);
  };

  useEffect(() => {
    const start = pos;
    tick(() => doHopSequence(start, randPos()), 800);
    return () => clearAllTimers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When foodTarget changes from null to a value, interrupt current wander
  // by pausing briefly and restarting toward the food target.
  const prevFoodTarget = useRef(null);
  useEffect(() => {
    const hadFood   = prevFoodTarget.current !== null;
    const hasFood   = foodTarget !== null;
    prevFoodTarget.current = foodTarget;

    if (!hadFood && hasFood) {
      // Clear current timers and restart hop sequence toward food
      clearAllTimers();
      isPaused.current = false;
      // Small delay so state settles, then hop toward food from current pos
      const id = setTimeout(() => {
        doHopSequence(posRef.current, foodTarget);
      }, 50);
      timers.current.push(id);
    }
  }, [foodTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle isEating prop
  const prevIsEating = useRef(false);
  useEffect(() => {
    if (isEating && !prevIsEating.current) {
      // Pause hopping
      isPaused.current = true;
      clearAllTimers();

      // Play gulp animation
      setEatKey(k => k + 1);
      setEatPhase(EatPhase.GULP);

      const id1 = setTimeout(() => {
        // After gulp, play shimmy
        setEatKey(k => k + 1);
        setEatPhase(EatPhase.SHIMMY);

        const id2 = setTimeout(() => {
          setEatPhase(EatPhase.NONE);
          isPaused.current = false;
          if (onEatComplete) onEatComplete();
          // Resume wandering from current position
          const id3 = setTimeout(() => doHopSequence(posRef.current, randPos()), 200);
          timers.current.push(id3);
        }, 500);
        timers.current.push(id2);
      }, 600);
      timers.current.push(id1);
    }
    prevIsEating.current = isEating;
  }, [isEating]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle celebration (joy jumps after eating)
  const prevIsCelebrating = useRef(false);
  useEffect(() => {
    if (isCelebrating && !prevIsCelebrating.current) {
      isPaused.current = true;
      clearAllTimers();
      setIsSmiling(true);
      setCelebrationJumpsLeft(3);

      const doCelebrationJump = (jumpsRemaining) => {
        setHopKey(k => k + 1);
        const nextJumps = jumpsRemaining - 1;

        if (nextJumps > 0) {
          const id = setTimeout(() => doCelebrationJump(nextJumps), 700);
          timers.current.push(id);
        } else {
          // After 3 jumps, go back to idle
          const id = setTimeout(() => {
            setIsSmiling(false);
            isPaused.current = false;
            setCelebrationJumpsLeft(0);
          }, 700);
          timers.current.push(id);
        }
      };

      const id = setTimeout(() => doCelebrationJump(3), 100);
      timers.current.push(id);
    }
    prevIsCelebrating.current = isCelebrating;
  }, [isCelebrating]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Petting ───────────────────────────────────────────────────────────────
  // Nintendogs model: the blob reacts while the pointer is held *and* moving.
  // Hold still and the shimmy stops even though the button is still down.
  const petAllowed = canPet && !isEating && !isCelebrating;

  // Geometry read inside long-lived listeners, which would otherwise close over
  // a stale svgPx once the blob grows.
  const svgPxRef = useRef(svgPx);
  svgPxRef.current = svgPx;

  const writeLeanTransform = () => {
    const el = leanRef.current;
    if (!el) return;
    const lean     = leanRef_value.current;
    const offsetPx = lean * svgPxRef.current * PET_LEAN_WIDTH_RATIO;
    const skewDeg  = -lean * PET_LEAN_SKEW_DEG; // negative tips the top toward the pointer
    const squash   = isPettingRef.current ? 1 - PET_PRESS_SQUASH : 1;
    el.style.transform = `translateX(${offsetPx}px) skewX(${skewDeg}deg) scaleY(${squash})`;
  };

  const runLeanFrame = () => {
    const target = isPettingRef.current ? targetLeanRef.current : 0;
    leanRef_value.current += (target - leanRef_value.current) * PET_LEAN_DAMPING;

    const rubbing =
      isPettingRef.current && Date.now() - lastMoveAtRef.current < PET_MOTION_WINDOW_MS;
    setIsRubbing(prev => (prev === rubbing ? prev : rubbing));

    writeLeanTransform();

    // Once released, keep running until the lean has drifted back to neutral
    if (!isPettingRef.current && Math.abs(leanRef_value.current) < 0.005) {
      leanRef_value.current = 0;
      writeLeanTransform();
      leanRafRef.current = null;
      return;
    }
    leanRafRef.current = requestAnimationFrame(runLeanFrame);
  };

  const aimLeanAt = (clientX) => {
    const centerX = posRef.current.x + svgPxRef.current / 2;
    targetLeanRef.current = clamp((clientX - centerX) / (svgPxRef.current / 2), -1, 1);
  };

  const startPet = (e) => {
    if (!petAllowed || isPettingRef.current) return;
    isPettingRef.current = true;
    isPaused.current     = true;
    clearAllTimers(); // drop the wander so the blob holds still to be petted

    setEyeShift(0);

    // Not setting the pleased face here — it is driven by rubbing, below
    lastMoveAtRef.current = Date.now();
    aimLeanAt(e.clientX);
    if (!leanRafRef.current) leanRafRef.current = requestAnimationFrame(runLeanFrame);
  };

  const endPet = () => {
    if (!isPettingRef.current) return;
    isPettingRef.current = false;
    setIsRubbing(false);

    // Sit a beat longer before wandering off again
    const id = setTimeout(() => {
      isPaused.current = false;
      doHopSequence(posRef.current, randPos());
    }, PET_LINGER_MS);
    timers.current.push(id);
  };

  // Listeners live on window so a fast rub that outruns the cursor still counts.
  // Held in refs because this effect is mount-only.
  const endPetRef  = useRef(endPet);
  const aimLeanRef = useRef(aimLeanAt);
  endPetRef.current  = endPet;
  aimLeanRef.current = aimLeanAt;

  useEffect(() => {
    const onMove = (e) => {
      if (!isPettingRef.current) return;
      lastMoveAtRef.current = Date.now();
      aimLeanRef.current(e.clientX);
    };
    const onRelease = () => endPetRef.current();

    window.addEventListener("pointermove",   onMove);
    window.addEventListener("pointerup",     onRelease);
    window.addEventListener("pointercancel", onRelease);
    return () => {
      window.removeEventListener("pointermove",   onMove);
      window.removeEventListener("pointerup",     onRelease);
      window.removeEventListener("pointercancel", onRelease);
      if (leanRafRef.current)      cancelAnimationFrame(leanRafRef.current);
      if (pleasedTimerRef.current) clearTimeout(pleasedTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The pleased face tracks the *rubbing*, not the press, so holding the pointer
  // still lets the expression fade the same way the shimmy does. The lean stays,
  // since a motionless finger is still touching the blob.
  useEffect(() => {
    if (pleasedTimerRef.current) clearTimeout(pleasedTimerRef.current);
    if (isRubbing) {
      setIsPleased(true);
    } else {
      pleasedTimerRef.current = setTimeout(() => setIsPleased(false), PET_EXPRESSION_HOLD_MS);
    }
  }, [isRubbing]);

  // Feeding or celebrating takes the blob back; drop any pet in progress
  useEffect(() => {
    if (!petAllowed && isPettingRef.current) {
      isPettingRef.current = false;
      setIsRubbing(false);
      setIsPleased(false);
    }
  }, [petAllowed]);

  // Fixed light source at top-center of screen. Compute which direction
  // the blob is "looking toward" the light, then shift the gloss that way.
  // lnx: +1 when blob is at far left (light to its right), -1 at far right
  const blobCX = pos.x + svgPx / 2;
  const lnx = (window.innerWidth / 2 - blobCX) / (window.innerWidth / 2);
  // x shifts with light angle; y traces a shallow arc (higher at center, drops toward sides)
  const glossX = 100 + lnx * 35;
  const glossY = 52 + lnx * lnx * 14;

  const lEye = 68  + eyeShift;
  const rEye = 128 + eyeShift;

  // Three faces: pleased (petting) is a wide contented squint, deliberately
  // flatter and broader than the celebration smile so the two read apart.
  const pleasedEyes = (
    <>
      <path d="M 56,96 A 11,7 0 0,1 80,96"   fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
      <path d="M 116,94 A 11,7 0 0,1 140,94" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    </>
  );
  const smilingEyes = (
    <>
      <path d="M 62,95 A 6,6 0 0,1 74,95"   fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 122,93 A 6,6 0 0,1 134,93" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
    </>
  );
  const neutralEyes = (
    <>
      <circle cx={lEye} cy="92" r="6" fill="#000" />
      <circle cx={rEye} cy="90" r="6" fill="#000" />
    </>
  );
  const eyes = isPleased ? pleasedEyes : isSmiling ? smilingEyes : neutralEyes;

  const shadowW = svgPx * 0.72;
  const shadowH = Math.max(4, svgPx * 0.04);

  // Determine eating animation class
  const eatClass = eatPhase === EatPhase.GULP ? 'mh-gulp' : eatPhase === EatPhase.SHIMMY ? 'mh-shimmy' : '';

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 9999 }}>

        {/* Shadow — outer div tracks position smoothly, inner div runs the animation */}
        <div style={{
          position: "absolute",
          left:     pos.x + (svgPx - shadowW) / 2,
          top:      pos.y + svgPx * 0.88,
          width:    shadowW,
          height:   shadowH,
          transition: `left ${HOP_MS}ms ease-in-out, top ${HOP_MS}ms ease-in-out`,
        }}>
          <div
            key={hopKey}
            className={hopKey > 0 ? "mh-shadow" : ""}
            style={{ width: "100%", height: "100%", background: "rgba(0,0,0,0.15)", borderRadius: "50%", transformOrigin: "center" }}
          />
        </div>

        {/* Blob — one div handles arc + stretch + squash + jello all in one keyframe */}
        <div className="mh-position" style={{
          position:   "absolute",
          left:        pos.x,
          top:         pos.y,
          transition: `left ${HOP_MS}ms ease-in-out, top ${HOP_MS}ms ease-in-out`,
        }}>
          <div
            key={eatPhase === EatPhase.NONE ? hopKey : `eat-${eatKey}`}
            className={eatPhase !== EatPhase.NONE ? eatClass : (hopKey > 0 ? "mh-hop" : "")}
            style={{ transformOrigin: "center bottom" }}
          >
            {/* Lean rides inside the hop so the two compose; the shimmy gets its
                own layer because a CSS animation would overwrite the inline lean */}
            <div ref={leanRef} style={{ transformOrigin: "center bottom", willChange: "transform" }}>
              <div
                className={isRubbing ? "mh-pet-shimmy" : ""}
                style={{ transformOrigin: "center bottom" }}
              >
              <svg
                className="monster"
                width={svgPx} height={svgPx}
                viewBox={`0 0 ${SVG_BASE_SIZE} ${SVG_BASE_SIZE}`}
                onPointerDown={startPet}
                style={{
                  pointerEvents: petAllowed ? "auto" : "none",
                  touchAction:   "none", // stop touch-drag from scrolling the page mid-pet
                  cursor:        petAllowed ? "grab" : "default",
                }}
              >
                <defs>
                  <linearGradient id="mhBg" x1="100" y1="25" x2="100" y2="180" gradientUnits="userSpaceOnUse">
                    <stop offset="0%"   stopColor={bodyLight} />
                    <stop offset="50%"  stopColor={bodyMid}   />
                    <stop offset="100%" stopColor={bodyDark}  />
                  </linearGradient>
                  <filter id="mhF1" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6" /></filter>
                  <filter id="mhF2" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5" /></filter>
                  <filter id="mhF3" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2" /></filter>
                  <clipPath id="mhC">
                    <path d="M 100,25 C 148,22 192,62 194,108 C 196,148 168,178 100,180 C 32,178 4,148 6,108 C 8,62 52,22 100,25 Z" />
                  </clipPath>
                </defs>
                <path d="M 100,25 C 148,22 192,62 194,108 C 196,148 168,178 100,180 C 32,178 4,148 6,108 C 8,62 52,22 100,25 Z" fill="url(#mhBg)" />
                <ellipse cx="90" cy="162" rx="62" ry="20" fill={glowColor}  opacity="0.35" filter="url(#mhF1)" clipPath="url(#mhC)" />
                <ellipse cx={glossX}      cy={glossY}      rx="32" ry="24" fill={glossColor} opacity="0.6"  filter="url(#mhF2)" clipPath="url(#mhC)" />
                <ellipse cx={glossX - 4} cy={glossY - 4}  rx="14" ry="10" fill={glossColor} opacity="0.95" filter="url(#mhF3)" clipPath="url(#mhC)" />
                <ellipse className="mh-blush" cx="44"  cy="118" rx="15" ry="9" fill={BLUSH_COLOR}
                         opacity={isPleased ? 0.5 : 0} filter="url(#mhF3)" clipPath="url(#mhC)" />
                <ellipse className="mh-blush" cx="156" cy="116" rx="15" ry="9" fill={BLUSH_COLOR}
                         opacity={isPleased ? 0.5 : 0} filter="url(#mhF3)" clipPath="url(#mhC)" />
                {eyes}
              </svg>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
