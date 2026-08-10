import { useState } from "react";
import "./App.css";
import MonsterHop from "./MonsterHop";
import FeedingMechanic from "./feeding/FeedingMechanic";
import ColorPicker from "./ColorPicker";
import { PaperPhase } from "./constants/paperPhase";
function App() {
  const [feedPhase, setFeedPhase] = useState(PaperPhase.IDLE);
  const [monsterPos, setMonsterPos] = useState({ x: 0, y: 0 });
  const [foodLandPos, setFoodLandPos] = useState(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [celebrationBurst, setCelebrationBurst] = useState(0);
  const [monsterSize, setMonsterSize] = useState(() => {
    const s = localStorage.getItem("monsterSize");
    const parsed = s !== null ? parseFloat(s) : null;
    return parsed !== null && !isNaN(parsed) ? parsed : 0.5;
  });
  const [hue, setHue] = useState(() => {
    const s = localStorage.getItem("monsterHue");
    if (s !== null) return parseInt(s, 10);
    const randomHue = Math.floor(Math.random() * 360);
    localStorage.setItem("monsterHue", String(randomHue));
    return randomHue;
  });

  const handleHueChange = (newHue) => {
    setHue(newHue);
    localStorage.setItem("monsterHue", String(newHue));
  };

  const handleFoodLanded = (pos) => {
    setFoodLandPos(pos);
    setFeedPhase(PaperPhase.LANDED);
  };

  const handleFoodArrived = () => {
    setFeedPhase(PaperPhase.BEING_EATEN);
  };

  const handleEatComplete = () => {
    setMonsterSize((prev) => {
      const next = prev + 0.04;
      localStorage.setItem("monsterSize", String(next));
      return next;
    });
    setFoodLandPos(null);
    setFeedPhase(PaperPhase.IDLE);
    setIsCelebrating(true);
    setCelebrationBurst(1);
    setTimeout(() => setCelebrationBurst(2), 700);
    setTimeout(() => setCelebrationBurst(3), 1400);
    setTimeout(() => setCelebrationBurst(4), 2100);
    setTimeout(() => setIsCelebrating(false), 3500);
  };

  return (
    <div className="app">
      <ColorPicker hue={hue} onHueChange={handleHueChange} />
      <MonsterHop
        size={monsterSize}
        hue={hue}
        onPosChange={setMonsterPos}
        foodTarget={feedPhase === PaperPhase.LANDED ? foodLandPos : null}
        isEating={feedPhase === PaperPhase.BEING_EATEN}
        isCelebrating={isCelebrating}
        onFoodArrived={handleFoodArrived}
        onEatComplete={handleEatComplete}
      />
      {celebrationBurst > 0 &&
        Array.from({ length: 3 }).map((_, i) => {
          let driftX = (i - 1) * 100 * monsterSize;
          let driftY = i === 1 ? -30 : -15;
          return (
            <div
              key={`${celebrationBurst}-${i}`}
              style={{
                position: "fixed",
                left: monsterPos.x + 100 * monsterSize + driftX,
                top: monsterPos.y + driftY,
                fontSize: "44px",
                pointerEvents: "none",
                zIndex: 10000,
                animation: `heartBurst 3s ease-out forwards`,
                animationDelay: `${i * 20}ms`,
                transform: 'translateX(-50%)',
              }}
            >
              ❤️
            </div>
          );
        })}
      <style>{`
        @keyframes heartBurst {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          60% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-180px) scale(1); }
        }
      `}</style>
      <FeedingMechanic
        feedPhase={feedPhase}
        setFeedPhase={setFeedPhase}
        monsterPos={monsterPos}
        monsterSize={monsterSize}
        onFoodLanded={handleFoodLanded}
      />
    </div>
  );
}

export default App;
