import React from "react";

interface AiPanelFeatureProps {
  name: string;
  description: string;
  live: boolean;
}

const AiPanelFeature: React.FC<AiPanelFeatureProps> = ({
  name,
  description,
  live,
}) => {
  return (
    <div className="lg-inset flex flex-row items-start gap-3 px-3 py-2">
      <span
        aria-hidden="true"
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          live ? "bg-action" : "bg-ink-faint"
        }`}
      />
      <div>
        <p className="font-display text-sm font-bold text-ink">{name}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-dim">
          {description}
        </p>
      </div>
    </div>
  );
};

export default AiPanelFeature;
