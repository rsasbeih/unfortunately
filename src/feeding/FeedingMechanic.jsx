import { useRef, useEffect } from "react";
import FeedButton from "./FeedButton";
import PaperUI from "./PaperUI";
import CrumpledBall from "./CrumpledBall";
import ProjectileBall from "./ProjectileBall";
import EatAnimation from "./EatAnimation";
import CreaseLines from "./CreaseLines";
import { PaperPhase } from "../constants/paperPhase";
import { SVG_BASE_SIZE } from "../constants/sizes";
export default function FeedingMechanic({
  feedPhase,
  setFeedPhase,
  monsterPos,
  monsterSize,
  onFoodLanded,
}) {
  const throwData = useRef({ vx: 0, vy: 0, startX: 0, startY: 0 });
  const lastMouse = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const ballLandPos = useRef(null); // center of where ball settled

  useEffect(() => {
    const track = (e) => {
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", track);
    return () => window.removeEventListener("mousemove", track);
  }, []);

  const handleThrow = (vel) => {
    throwData.current = vel;
    setFeedPhase(PaperPhase.THROWING);
  };

  const handleDrop = (pos) => {
    ballLandPos.current = pos;
    onFoodLanded(pos);
  };

  const handleLand = (pos) => {
    ballLandPos.current = pos;
    onFoodLanded(pos);
  };

  const renderLandedBall = () => {
    const lp = ballLandPos.current;
    if (!lp) return null;
    return (
      <div
        style={{
          position: "fixed",
          left: lp.x - 28,
          top: lp.y - 28,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #f5f5f0, #d8d8d0)",
          boxShadow: "2px 3px 8px rgba(0,0,0,0.25)",
          pointerEvents: "none",
          zIndex: 9998,
          userSelect: "none",
        }}
      >
        <svg
          viewBox="0 0 56 56"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            overflow: "hidden",
          }}
        >
          <CreaseLines type="radial" />
        </svg>
      </div>
    );
  };

  switch (feedPhase) {
    case PaperPhase.IDLE:
      return <FeedButton onClick={() => setFeedPhase(PaperPhase.COMPOSING)} />;

    case PaperPhase.COMPOSING:
      return (
        <>
          <FeedButton />
          <PaperUI
            onCrumple={() => setFeedPhase(PaperPhase.HOLDING)}
            onCancel={() => setFeedPhase(PaperPhase.IDLE)}
          />
        </>
      );

    case PaperPhase.HOLDING:
      return (
        <CrumpledBall
          initialPos={lastMouse.current}
          onThrow={handleThrow}
          onDrop={handleDrop}
          monsterPos={monsterPos}
          monsterSize={monsterSize}
        />
      );

    case PaperPhase.THROWING: {
      const svgPx = SVG_BASE_SIZE * monsterSize;
      return (
        <ProjectileBall
          startPos={{ x: throwData.current.startX, y: throwData.current.startY }}
          startVelocity={throwData.current}
          onLand={handleLand}
          monsterPos={monsterPos}
          monsterSvgPx={svgPx}
        />
      );
    }

    case PaperPhase.LANDED:
      // Ball resting on screen, monster walking toward it
      return renderLandedBall();

    case PaperPhase.BEING_EATEN: {
      // Monster arrived; ball travels to monster with particle burst
      const lp = ballLandPos.current;
      if (!lp) return null;
      return (
        <EatAnimation
          ballPos={lp}
          monsterPos={monsterPos}
          monsterSize={monsterSize}
        />
      );
    }

    default:
      return null;
  }
}
