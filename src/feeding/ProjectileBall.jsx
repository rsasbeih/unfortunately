import { useEffect, useRef } from 'react';
import CreaseLines from './CreaseLines';
import { BALL_LIGHT, BALL_MEDIUM, BALL_CREASE } from '../constants/colors';

const BALL_RADIUS = 28;
const BALL_SIZE   = 56;

export default function ProjectileBall({ startPos, startVelocity, onLand }) {
  const ballRef      = useRef(null);
  const rafRef       = useRef(null);
  const landedRef    = useRef(false);
  const squashingRef = useRef(false);

  useEffect(() => {
    const ball = ballRef.current;
    if (!ball) return;

    const state = {
      x:        startPos ? startPos.x - BALL_RADIUS : window.innerWidth  / 2,
      y:        startPos ? startPos.y - BALL_RADIUS : window.innerHeight / 2,
      vx:       (startVelocity?.vx ?? 0) * 3,
      vy:       (startVelocity?.vy ?? 0) * 3,
      rotation: 0,
    };

    ball.style.left      = state.x + 'px';
    ball.style.top       = state.y + 'px';
    ball.style.transform = `rotate(${state.rotation}deg)`;

    const floorY        = window.innerHeight * 0.92;
    let bounceCount     = 0;
    const GRAVITY_OFF_AFTER = 4;

    function triggerSquash(isFloor) {
      if (squashingRef.current) return;
      squashingRef.current = true;
      const sx = isFloor ? 1.28 : 0.78;
      const sy = isFloor ? 0.78 : 1.28;
      ball.style.transition = 'none';
      ball.style.transform  = `rotate(${state.rotation}deg) scaleX(${sx}) scaleY(${sy})`;
      setTimeout(() => {
        ball.style.transition = 'transform 95ms ease-out';
        ball.style.transform  = `rotate(${state.rotation}deg) scaleX(1) scaleY(1)`;
        setTimeout(() => {
          ball.style.transition = '';
          squashingRef.current  = false;
        }, 95);
      }, 65);
    }

    function land() {
      if (landedRef.current) return;
      landedRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      ball.style.transition = 'transform 350ms ease-out, filter 350ms ease-out';
      ball.style.transform  = 'rotate(0deg)';
      ball.style.filter     = 'none';

      const centerX = state.x + BALL_RADIUS;
      const centerY = state.y + BALL_RADIUS;
      setTimeout(() => onLand?.({ x: centerX, y: centerY }), 350);
    }

    function loop() {
      const gravityFade = Math.max(0, 1 - bounceCount / GRAVITY_OFF_AFTER);
      const friction    = Math.max(0.97, 0.99 - (bounceCount / GRAVITY_OFF_AFTER) * 0.02);

      state.vy += 0.5 * gravityFade;
      state.vx *= friction;
      state.vy *= friction;

      state.x        += state.vx;
      state.y        += state.vy;
      state.rotation += state.vx * 0.8;

      ball.style.left = state.x + 'px';
      ball.style.top  = state.y + 'px';
      if (!squashingRef.current) {
        ball.style.transform = `rotate(${state.rotation}deg)`;
      }

      // Wall bounces
      if (state.x < 0) {
        state.x  = 0;
        state.vx *= -0.65;
        bounceCount++;
        triggerSquash(false);
      } else if (state.x + BALL_SIZE > window.innerWidth) {
        state.x  = window.innerWidth - BALL_SIZE;
        state.vx *= -0.65;
        bounceCount++;
        triggerSquash(false);
      }

      // Ceiling bounce
      if (state.y < 0) {
        state.y  = 0;
        state.vy *= -0.65;
        bounceCount++;
        triggerSquash(true);
      }

      // Floor bounce
      if (state.y + BALL_SIZE > floorY) {
        state.y  = floorY - BALL_SIZE;
        state.vy *= -0.65;
        state.vx *= 0.9;
        bounceCount++;
        triggerSquash(true);
      }

      if (Math.hypot(state.vx, state.vy) < 0.4) { land(); return; }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div
      ref={ballRef}
      className="pb-ball"
      style={{
        position:  'fixed',
        width:      BALL_SIZE,
        height:     BALL_SIZE,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${BALL_LIGHT}, ${BALL_MEDIUM})`,
        boxShadow:  '2px 3px 8px rgba(0,0,0,0.25)',
        filter:     'blur(1px)',
        pointerEvents: 'none',
        zIndex:     9999,
        willChange: 'transform, left, top',
        userSelect: 'none',
      }}
    >
      <svg
        width={BALL_SIZE} height={BALL_SIZE}
        viewBox={`0 0 ${BALL_SIZE} ${BALL_SIZE}`}
        style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}
      >
        <CreaseLines type="offset" />
      </svg>
    </div>
  );
}
