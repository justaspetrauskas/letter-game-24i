import React from "react";

interface RivalProps {
  available: boolean;
  line: string | null;
  muted: boolean;
  thinking: boolean;
  onToggleMute: () => void;
}

const Rival: React.FC<RivalProps> = ({
  available,
  line,
  muted,
  thinking,
  onToggleMute,
}) => {
  if (!available) {
    return null;
  }

  return (
    <div className="w-full rounded-sm border-2 border-panel-outline bg-panel-sunk px-3 py-2">
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-faint">
          Rival
        </h3>
        <button
          type="button"
          className="text-xs font-bold uppercase tracking-widest text-ink-faint transition-colors duration-150 hover:text-ink"
          onClick={onToggleMute}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      </div>

      <p
        className={`mt-2 text-sm italic leading-relaxed ${
          muted ? "text-ink-faint" : "text-ink-dim"
        }`}
      >
        {muted
          ? "Muted."
          : line !== null
            ? line
            : thinking
              ? "..."
              : "Watching."}
      </p>
    </div>
  );
};

export default Rival;
