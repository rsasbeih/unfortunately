/** Settings button + panel letting the user change the blob's hue via a slider. */
import { useState } from "react";
import { PAPER_LIGHT, PAPER_BORDER, TEXT_LABEL } from "./constants/colors";
import { MOBILE_BREAKPOINT_PX, TOUCH_TARGET_MIN_PX, PAPER_EDGE_GAP_PX } from "./constants/layout";

const STYLES = `
.cp-gear {
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  transition: transform 200ms ease;
}
/* Guarded: on a touch screen a tapped :hover sticks until you tap elsewhere,
   leaving the gear permanently rotated */
@media (hover: hover) {
  .cp-gear:hover { transform: rotate(30deg); }
}
.cp-panel {
  font-family: monospace;
}
.cp-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 200px;
  height: 8px;
  border-radius: 4px;
  outline: none;
}
.cp-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #888;
  cursor: pointer;
}
.cp-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #888;
  cursor: pointer;
}

@media (max-width: ${MOBILE_BREAKPOINT_PX}px) {
  /* Reach the touch minimum, and let the slider use the width it has */
  .cp-gear {
    width:  ${TOUCH_TARGET_MIN_PX}px !important;
    height: ${TOUCH_TARGET_MIN_PX}px !important;
  }
  .cp-slider {
    width: 100%;
    height: 14px;
  }
  .cp-slider::-webkit-slider-thumb { width: 26px; height: 26px; }
  .cp-slider::-moz-range-thumb     { width: 26px; height: 26px; }
  .cp-panel {
    max-width: calc(100vw - ${PAPER_EDGE_GAP_PX * 2}px);
    box-sizing: border-box;
  }
}
`;

export default function ColorPicker({ hue, onHueChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="cp-gear"
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 10001,
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: PAPER_LIGHT,
          border: `1px solid ${PAPER_BORDER}`,
          borderRadius: "50%",
          boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
          fontSize: 18,
        }}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((open) => !open);
          }
        }}
        role="button"
        tabIndex={0}
        title="Settings"
      >
        ⚙️
      </div>

      {isOpen && (
        <div
          className="cp-panel"
          style={{
            position: "fixed",
            top: 68,
            right: 24,
            zIndex: 10001,
            background: PAPER_LIGHT,
            border: `1px solid ${PAPER_BORDER}`,
            borderRadius: 12,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <label style={{ fontSize: 12, color: TEXT_LABEL }}>blob color</label>
          <input
            className="cp-slider"
            type="range"
            min="0"
            max="359"
            value={hue}
            onChange={(e) => onHueChange(parseInt(e.target.value, 10))}
            style={{
              background: `linear-gradient(to right,
                hsl(0,70%,60%), hsl(60,70%,60%), hsl(120,70%,60%),
                hsl(180,70%,60%), hsl(240,70%,60%), hsl(300,70%,60%), hsl(360,70%,60%))`,
            }}
          />
        </div>
      )}
    </>
  );
}
