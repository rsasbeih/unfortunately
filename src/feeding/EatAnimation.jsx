import { useEffect, useRef } from 'react';
import CreaseLines from './CreaseLines';
import { BALL_LIGHT, BALL_MEDIUM, PARTICLE_SUCTION } from '../constants/colors';
import { SVG_BASE_SIZE } from '../constants/sizes';

const BALL_RADIUS      = 28;
const BALL_SIZE        = 56;
const BURST_AT         = 300;  // ms — ball arrives + flash + burst
const BURST_DURATION   = 150;  // ms outward
const CONVERGE_DURATION = 420; // ms inward (ease-in cubic, staggered)
const PARTICLE_COUNT   = 16;
const SUCK_COUNT       = 5;

function buildParticles(cx, cy) {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle    = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.7;
    const speed    = 7 + Math.random() * 9;          // px/frame
    const delay    = Math.random() * 55;              // ms stagger within burst window
    const maxR     = i < 4 ? 2.5 + Math.random() * 2 : 3.5 + Math.random() * 3.5;
    const isSparkle = i < 4;
    const lightness = 72 + Math.random() * 18;

    // Pre-bake the burst endpoint (where the particle travels to before reversing)
    const frames   = BURST_DURATION / 16.67;
    const burstEndX = cx + Math.cos(angle) * speed * frames * 0.55; // ease-out quadratic (0.55 distance factor)
    const burstEndY = cy + Math.sin(angle) * speed * frames * 0.55; // ease-out quadratic (0.55 distance factor)

    return {
      color:     isSparkle ? PARTICLE_SUCTION : `hsl(38, 32%, ${lightness}%)`,
      delay,
      maxR,
      burstEndX,
      burstEndY,
    };
  });
}

function buildSuckParticles(bx, by) {
  return Array.from({ length: SUCK_COUNT }, (_, i) => {
    const angle  = (i / SUCK_COUNT) * Math.PI * 2 + Math.random() * 0.5;
    const offset = 18 + Math.random() * 20;
    return {
      startX: bx + Math.cos(angle) * offset,
      startY: by + Math.sin(angle) * offset,
      delay:  i * 45 + Math.random() * 20,
      r:      1.8 + Math.random() * 1.8,
    };
  });
}

export default function EatAnimation({ ballPos, monsterPos, monsterSize }) {
  const canvasRef  = useRef(null);
  const ballDivRef = useRef(null);
  const rafRef     = useRef(null);

  const svgPx     = SVG_BASE_SIZE * monsterSize;
  const monsterCX = monsterPos.x + svgPx / 2;
  const monsterCY = monsterPos.y + svgPx / 2;

  useEffect(() => {
    const canvas  = canvasRef.current;
    const ballDiv = ballDivRef.current;
    if (!canvas || !ballDiv) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const particles     = buildParticles(monsterCX, monsterCY);
    const suckParticles = buildSuckParticles(ballPos.x, ballPos.y);
    const startTime     = performance.now();

    // After 1 RAF: trigger ball travel CSS transition (must paint initial pos first)
    requestAnimationFrame(() => {
      if (!ballDiv) return;
      ballDiv.style.transition = 'left 280ms ease-in, top 280ms ease-in, transform 280ms ease-in';
      ballDiv.style.left       = (monsterCX - BALL_RADIUS) + 'px';
      ballDiv.style.top        = (monsterCY - BALL_RADIUS) + 'px';
      ballDiv.style.transform  = 'scale(0.25)';
    });

    // Fade the ball div out just before it reaches the monster
    const fadeTimer = setTimeout(() => {
      if (!ballDiv) return;
      ballDiv.style.transition += ', opacity 80ms ease-in';
      ballDiv.style.opacity     = '0';
    }, 230);

    let running = true;

    function draw(now) {
      if (!running) return;
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Suction anticipation particles (drift ball → monster, 0–280ms) ──
      suckParticles.forEach(sp => {
        const age = elapsed - sp.delay;
        if (age < 0 || age > 300) return;
        const t      = Math.min(1, age / 280);
        const ease   = t * t;
        const x      = sp.startX + (monsterCX - sp.startX) * ease;
        const y      = sp.startY + (monsterCY - sp.startY) * ease;
        const alpha  = t < 0.75 ? 0.65 : 0.65 * (1 - (t - 0.75) / 0.25); // 65% base opacity for suction particles
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = PARTICLE_SUCTION;
        ctx.beginPath();
        ctx.arc(x, y, sp.r * (1 - t * 0.4), 0, Math.PI * 2);
        ctx.fill();
      });

      // ── White flash at absorption moment ──
      if (elapsed >= BURST_AT && elapsed < BURST_AT + 90) {
        const ft = (elapsed - BURST_AT) / 90;
        const gr = ctx.createRadialGradient(monsterCX, monsterCY, 0, monsterCX, monsterCY, 55 + ft * 25);
        gr.addColorStop(0, `rgba(255,255,255,${(1 - ft) * 0.85})`);
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle   = gr;
        ctx.fillRect(monsterCX - 90, monsterCY - 90, 180, 180);
      }

      // ── Burst → converge particles ──
      const burstStart = BURST_AT;
      particles.forEach(p => {
        const pAge = elapsed - burstStart - p.delay;
        if (pAge < 0) return;

        let x, y, alpha, r;

        if (pAge < BURST_DURATION) {
          // Outward burst — ease-out quad
          const t     = pAge / BURST_DURATION;
          const eOut  = 1 - (1 - t) * (1 - t);
          x     = monsterCX + (p.burstEndX - monsterCX) * eOut;
          y     = monsterCY + (p.burstEndY - monsterCY) * eOut;
          alpha = 1;
          r     = p.maxR;
        } else {
          // Converge inward — ease-in cubic (chaos → converge is the key satisfaction mechanic)
          const convergeAge = pAge - BURST_DURATION;
          const t     = Math.min(1, convergeAge / CONVERGE_DURATION);
          const eIn   = t * t * t;
          x     = p.burstEndX + (monsterCX - p.burstEndX) * eIn;
          y     = p.burstEndY + (monsterCY - p.burstEndY) * eIn;
          alpha = Math.max(0, 1 - t * 1.15);
          r     = p.maxR * Math.max(0, 1 - t * 0.8); // 80% radius decay during converge
        }

        if (alpha > 0.01 && r > 0.05) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle   = p.color;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;

      const totalDuration = BURST_AT + BURST_DURATION + CONVERGE_DURATION + 80;
      if (elapsed < totalDuration && running) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      clearTimeout(fadeTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Same crease lines as SettledBall
  return (
    <>
      <div
        ref={ballDivRef}
        style={{
          position:     'fixed',
          left:          ballPos.x - BALL_RADIUS,
          top:           ballPos.y - BALL_RADIUS,
          width:         BALL_SIZE,
          height:        BALL_SIZE,
          borderRadius:  '50%',
          background:    `radial-gradient(circle at 35% 35%, ${BALL_LIGHT}, ${BALL_MEDIUM})`,
          boxShadow:     '2px 3px 8px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
          zIndex:        9999,
          userSelect:    'none',
        }}
      >
        <svg viewBox="0 0 56 56"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', borderRadius:'50%', overflow:'hidden' }}>
          <CreaseLines type="radial" />
        </svg>
      </div>

      {/* Full-screen canvas overlay for all particle effects */}
      <canvas
        ref={canvasRef}
        style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9998 }}
      />
    </>
  );
}
