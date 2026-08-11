import { useEffect, useRef, useState } from 'react';
import CreaseLines from './CreaseLines';

const STYLES = `
@keyframes cbPopin {
  0%   { scale: 0; }
  70%  { scale: 1.15; }
  100% { scale: 1; }
}
@keyframes cbParticle {
  0%   { opacity: 0; transform: translate(-50%, -50%); }
  25%  { opacity: 1; transform: translate(-50%, calc(-50% - 10px)); }
  100% { opacity: 0; transform: translate(-50%, calc(-50% - 28px)); }
}
.cb-popin { animation: cbPopin 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.cb-particle { animation: cbParticle 900ms ease-out forwards; pointer-events: none; }
`;

export default function CrumpledBall({ initialPos, onThrow, onDrop }) {
  const ballRef     = useRef(null);
  const ballX       = useRef(initialPos?.x - 28 ?? window.innerWidth  / 2 - 28);
  const ballY       = useRef(initialPos?.y - 28 ?? window.innerHeight / 2 - 28);
  const targetX     = useRef(ballX.current);
  const targetY     = useRef(ballY.current);
  const rotation    = useRef(0);
  const velocityX   = useRef(0);
  const positions   = useRef([]);
  const rafId       = useRef(null);
  const mounted     = useRef(false);
  const [showParticle, setShowParticle] = useState(true);

  useEffect(() => {
    mounted.current = true;

    // Apply initial position immediately so ball isn't at 0,0 on first paint
    if (ballRef.current) {
      ballRef.current.style.left = ballX.current + 'px';
      ballRef.current.style.top  = ballY.current + 'px';
    }

    let lastTime = performance.now();

    const frame = (now) => {
      if (!mounted.current) return;
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      const prevX = ballX.current;
      ballX.current += (targetX.current - ballX.current) * 0.22; // position damping (22% of delta per frame)
      ballY.current += (targetY.current - ballY.current) * 0.22; // position damping (22% of delta per frame)

      const frameVx = dt > 0 ? (ballX.current - prevX) / dt : 0;
      velocityX.current += (frameVx - velocityX.current) * 0.25; // velocity smoothing (25% per frame)
      rotation.current  += (velocityX.current * 180 - rotation.current) * 0.1; // rotation damping (10% per frame)

      if (ballRef.current) {
        ballRef.current.style.left      = ballX.current + 'px';
        ballRef.current.style.top       = ballY.current + 'px';
        ballRef.current.style.transform = `rotate(${rotation.current}deg)`;
      }

      rafId.current = requestAnimationFrame(frame);
    };

    rafId.current = requestAnimationFrame(frame);

    // Pointer events, not mouse events: a touch device fires no mousemove at
    // all, so the ball never tracked the finger and every throw became a drop.
    const onPointerMove = (e) => {
      const now = Date.now();
      targetX.current = e.clientX - 28;
      targetY.current = e.clientY - 28;
      positions.current.push({ x: e.clientX, y: e.clientY, t: now });
      // Keep only last 80ms
      positions.current = positions.current.filter(p => now - p.t < 80);
    };

    const onPointerUp = () => {
      const now    = Date.now();
      const recent = positions.current.filter(p => now - p.t < 80);
      const cx     = ballX.current + 28;
      const cy     = ballY.current + 28;

      if (recent.length >= 2) {
        const first = recent[0];
        const last  = recent[recent.length - 1];
        const dt    = last.t - first.t;
        if (dt > 0) {
          const vx    = (last.x - first.x) / dt;
          const vy    = (last.y - first.y) / dt;
          const speed = Math.hypot(vx, vy);
          if (speed > 0.25) {
            onThrow({ vx, vy, startX: cx, startY: cy });
            return;
          }
        }
      }
      onDrop({ x: cx, y: cy });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup',   onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    const particleTimer = setTimeout(() => setShowParticle(false), 900);

    return () => {
      mounted.current = false;
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup',   onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      clearTimeout(particleTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{STYLES}</style>
      <div
        ref={ballRef}
        className="cb-popin"
        style={{
          position:     'fixed',
          top:          0,
          left:         0,
          width:        56,
          height:       56,
          borderRadius: '50%',
          background:   'radial-gradient(circle at 35% 35%, #f5f5f0, #d8d8d0)',
          filter:       'drop-shadow(0 2px 8px rgba(0,0,0,0.22))',
          pointerEvents:'none',
          zIndex:       99999,
          userSelect:   'none',
        }}
      >
        <svg
          viewBox="0 0 56 56"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', borderRadius:'50%', overflow:'hidden' }}
        >
          <CreaseLines type="radial" />
        </svg>

        {showParticle && (
          <span
            className="cb-particle"
            style={{
              position:   'absolute',
              left:       '50%',
              top:        '50%',
              fontFamily: 'Georgia, serif',
              fontStyle:  'italic',
              fontSize:   11,
              color:      '#888',
              whiteSpace: 'nowrap',
            }}
          >
            unfortunately
          </span>
        )}
      </div>
    </>
  );
}
