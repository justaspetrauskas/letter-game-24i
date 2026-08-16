import React from "react";

interface RivalWormProps {
  muted: boolean;
  speaking: boolean;
}

const RivalWorm: React.FC<RivalWormProps> = ({ muted, speaking }) => {
  return (
    <svg
      viewBox="0 0 56 52"
      className={`h-14 w-14 drop-shadow-md ${muted ? "opacity-45" : ""} ${
        speaking ? "animate-bob" : ""
      }`}
      role="img"
      aria-hidden="true"
    >
      <path
        d="M10 50 Q6 34 16 26 Q26 18 26 12"
        className="fill-none stroke-panel-outline"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path
        d="M10 50 Q6 34 16 26 Q26 18 26 12"
        className="fill-none stroke-action"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <ellipse
        cx="32"
        cy="16"
        rx="16"
        ry="14"
        className="fill-action stroke-panel-outline"
        strokeWidth="3"
      />
      <circle cx="28" cy="13" r="5" className="fill-crate-face" />
      <circle cx="40" cy="13" r="5" className="fill-crate-face" />
      <circle cx={muted ? 27 : 30} cy="14" r="2.4" className="fill-panel-outline" />
      <circle cx={muted ? 39 : 42} cy="14" r="2.4" className="fill-panel-outline" />
      <path
        d={muted ? "M26 24 Q32 21 38 24" : "M26 22 Q32 27 38 22"}
        className="fill-none stroke-panel-outline"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default RivalWorm;
