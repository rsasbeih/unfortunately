import { useState } from "react";
import { PAPER_LIGHT, PAPER_BORDER, PAPER_MEDIUM, PAPER_FOLD, PAPER_CREASE, TEXT_LABEL } from "../constants/colors";

const STYLES = `
@keyframes fbFloat {
  from { transform: translateY(0px); }
  to   { transform: translateY(-4px); }
}
.fb-wrap {
  animation: fbFloat 3s ease-in-out infinite alternate;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}
.fb-wrap:hover .fb-svg {
  transform: scale(1.1);
  transition: transform 200ms ease;
}
.fb-svg {
  display: block;
  transform: scale(1.0);
  transition: transform 200ms ease;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.18));
}
.fb-label {
  text-align: center;
  font-family: monospace;
  font-size: 10px;
  color: ${TEXT_LABEL};
  margin-top: 4px;
  opacity: 0;
  transition: opacity 200ms ease;
  white-space: nowrap;
}
.fb-wrap:hover .fb-label {
  opacity: 1;
}
`;

export default function FeedButton({ onClick }) {
  if (!onClick) return null;

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="fb-wrap"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
        onClick={onClick}
        title="you got mail"
      >
        <svg
          className="fb-svg"
          width="36"
          height="36"
          viewBox="0 0 36 36"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Paper body — slightly skewed to look folded */}
          <polygon
            points="4,3 32,5 30,33 6,31"
            fill={PAPER_LIGHT}
            stroke={PAPER_BORDER}
            strokeWidth="0.8"
          />
          {/* Folded top-right corner */}
          <polygon
            points="24,5 32,5 32,13"
            fill={PAPER_MEDIUM}
            stroke={PAPER_FOLD}
            strokeWidth="0.8"
          />
          {/* Crease lines suggesting crumpling */}
          <line x1="8"  y1="10" x2="22" y2="8"  stroke={PAPER_CREASE} strokeWidth="1"   strokeLinecap="round" />
          <line x1="6"  y1="16" x2="28" y2="15" stroke={PAPER_CREASE} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="8"  y1="22" x2="24" y2="21" stroke={PAPER_CREASE} strokeWidth="1"   strokeLinecap="round" />
          <line x1="10" y1="27" x2="20" y2="28" stroke={PAPER_CREASE} strokeWidth="0.8" strokeLinecap="round" />
          {/* Diagonal crumple crease */}
          <line x1="14" y1="6"  x2="9"  y2="20" stroke={PAPER_CREASE} strokeWidth="0.9" strokeLinecap="round" />
          <line x1="22" y1="14" x2="26" y2="26" stroke={PAPER_CREASE} strokeWidth="0.9" strokeLinecap="round" />
        </svg>
        <div className="fb-label">you got mail</div>
      </div>
    </>
  );
}
