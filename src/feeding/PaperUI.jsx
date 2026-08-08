import { useState, useEffect, useRef } from "react";

const STYLES = `
@keyframes puSlideIn {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes puShake {
  0%   { transform: translateX(0); }
  20%  { transform: translateX(-2px); }
  40%  { transform: translateX(2px); }
  60%  { transform: translateX(-2px); }
  80%  { transform: translateX(1px); }
  100% { transform: translateX(0); }
}
.pu-paper {
  animation: puSlideIn 300ms ease-out both;
}
.pu-paper.pu-shaking {
  animation: puShake 80ms linear;
}
.pu-stamp {
  display: inline-block;
  border: 2px solid #c0392b;
  border-radius: 4px;
  color: #c0392b;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.1em;
  padding: 6px 14px;
  transform: rotate(-5deg);
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
  background: transparent;
  font-family: inherit;
  line-height: 1;
}
.pu-stamp:hover {
  background: #c0392b;
  color: #fff;
}
`;

export default function PaperUI({ onCrumple, onCancel }) {
  const [text, setText] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [shaking, setShaking] = useState(false);
  const prevHadWord = useRef(false);
  const textareaRef = useRef(null);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  // Watch for "unfortunately" appearing in text
  useEffect(() => {
    const hasWord = /unfortunately/i.test(text);
    if (hasWord && !prevHadWord.current) {
      triggerShake();
    }
    prevHadWord.current = hasWord;
  }, [text]);

  const triggerShake = () => {
    setShaking(false);
    // Force reflow so the class re-triggers the animation
    requestAnimationFrame(() => {
      setShakeKey((k) => k + 1);
      setShaking(true);
      setTimeout(() => setShaking(false), 120);
    });
  };

  const handleCrumple = () => {
    if (!text.trim()) {
      triggerShake();
      return;
    }
    onCrumple();
  };

  // Background: lined paper via repeating-linear-gradient layered with solid color
  const background = `
    repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 27px,
      rgba(180,180,170,0.35) 27px,
      rgba(180,180,170,0.35) 28px
    ),
    #fafaf5
  `.trim();

  return (
    <>
      <style>{STYLES}</style>
      <div
        key={shakeKey}
        className={`pu-paper${shaking ? " pu-shaking" : ""}`}
        style={{
          position: "fixed",
          bottom: 70,
          right: 24,
          width: 400,
          height: 300,
          background,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          // Torn top edge via clip-path
          clipPath:
            "polygon(0% 8%, 10% 0%, 22% 6%, 35% 1%, 48% 7%, 60% 0%, 73% 5%, 85% 1%, 95% 4%, 100% 0%, 100% 100%, 0% 100%)",
          zIndex: 10001,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          style={{
            position: "absolute",
            top: 14,
            right: 12,
            background: "none",
            border: "none",
            fontSize: 18,
            color: "#ccc",
            cursor: "pointer",
            lineHeight: 1,
            padding: "0 2px",
            zIndex: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>

        {/* Header */}
        <div
          style={{
            paddingTop: 18,
            paddingLeft: 16,
            paddingBottom: 4,
            fontVariant: "small-caps",
            fontSize: 10,
            letterSpacing: "0.15em",
            color: "#bbb",
            fontFamily: "inherit",
            flexShrink: 0,
          }}
        >
          unfortunately
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="paste your rejection letter here..."
          style={{
            flex: 1,
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
            fontFamily: "inherit",
            color: "#444",
            resize: "none",
            padding: "12px 16px",
            boxSizing: "border-box",
            lineHeight: "28px",
          }}
        />

        {/* Footer with CRUMPLE stamp */}
        <div
          style={{
            flexShrink: 0,
            padding: "4px 16px 12px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <button className="pu-stamp" onClick={handleCrumple}>
            CRUMPLE
          </button>
        </div>
      </div>
    </>
  );
}
