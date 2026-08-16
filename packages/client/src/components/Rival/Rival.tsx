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
    <div className="w-full rounded-md border border-slate-700 px-4 py-3">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Rival
        </h2>
        <button
          type="button"
          className="text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors duration-150 hover:text-slate-200"
          onClick={onToggleMute}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      </div>

      <p
        className={`mt-3 text-sm italic leading-relaxed ${
          muted ? "text-slate-600" : "text-slate-300"
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
