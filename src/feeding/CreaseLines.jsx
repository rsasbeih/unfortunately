import { BALL_CREASE, BALL_CREASE_SECONDARY } from '../constants/colors';

export default function CreaseLines({ type = 'radial' }) {
  // Radial type: lines emanate from center (28, 28)
  if (type === 'radial') {
    return (
      <>
        <line x1="28" y1="28" x2="8"  y2="4"  stroke={BALL_CREASE_SECONDARY} strokeWidth="0.8" opacity="0.5" />
        <line x1="28" y1="28" x2="50" y2="6"  stroke={BALL_CREASE_SECONDARY} strokeWidth="0.8" opacity="0.5" />
        <line x1="28" y1="28" x2="54" y2="22" stroke={BALL_CREASE_SECONDARY} strokeWidth="0.8" opacity="0.5" />
        <line x1="28" y1="28" x2="52" y2="46" stroke={BALL_CREASE_SECONDARY} strokeWidth="0.8" opacity="0.5" />
        <line x1="28" y1="28" x2="10" y2="52" stroke={BALL_CREASE_SECONDARY} strokeWidth="0.8" opacity="0.5" />
        <line x1="28" y1="28" x2="4"  y2="30" stroke={BALL_CREASE_SECONDARY} strokeWidth="0.8" opacity="0.5" />
      </>
    );
  }

  // Offset type: angled crease lines for ProjectileBall
  if (type === 'offset') {
    const lines = [
      { x1: 14, y1: 10, x2: 30, y2: 28 },
      { x1: 30, y1: 8,  x2: 42, y2: 22 },
      { x1: 8,  y1: 24, x2: 22, y2: 38 },
      { x1: 36, y1: 30, x2: 48, y2: 44 },
      { x1: 18, y1: 38, x2: 32, y2: 50 },
      { x1: 40, y1: 16, x2: 54, y2: 32 },
    ];
    return (
      <>
        {lines.map((line, i) => (
          <line key={i}
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke={BALL_CREASE} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"
          />
        ))}
      </>
    );
  }

  return null;
}
