import React, { useEffect, useRef, useState } from "react";
import RivalWorm from "@/components/Rival/RivalWorm";

interface RivalProps {
  available: boolean;
  line: string | null;
  muted: boolean;
  thinking: boolean;
  timeMs: number;
  onToggleMute: () => void;
}

const LINE_LIFETIME_MS = 6500;

interface ShownLine {
  text: string;
  atMs: number;
}

const Rival: React.FC<RivalProps> = ({
  available,
  line,
  muted,
  thinking,
  timeMs,
  onToggleMute,
}) => {
  const [shown, setShown] = useState<ShownLine | null>(null);
  const timeRef = useRef(timeMs);
  timeRef.current = timeMs;

  useEffect(() => {
    if (line === null) {
      return;
    }
    setShown({ text: line, atMs: timeRef.current });
  }, [line]);

  if (!available) {
    return null;
  }

  const isFresh =
    shown !== null &&
    timeMs >= shown.atMs &&
    timeMs - shown.atMs < LINE_LIFETIME_MS;
  const speaking = !muted && isFresh;

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[5] flex max-w-[min(28rem,60%)] flex-row items-end gap-2">
      <button
        type="button"
        className="pointer-events-auto shrink-0 rounded-full transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-action"
        onClick={onToggleMute}
        aria-pressed={muted}
        aria-label={muted ? "Unmute the rival" : "Mute the rival"}
        title={muted ? "Unmute the rival" : "Mute the rival"}
      >
        <RivalWorm muted={muted} speaking={speaking} />
      </button>

      {speaking ? (
        <div
          key={shown.atMs}
          className="animate-pop relative mb-2 rounded-xl border-4 border-panel-outline bg-ink px-4 py-3 shadow-chunk"
        >
          <span
            className="absolute -left-[9px] bottom-3 h-3 w-3 rotate-45 border-b-4 border-l-4 border-panel-outline bg-ink"
            aria-hidden="true"
          />
          <p className="font-display text-sm font-bold leading-snug text-panel-outline">
            {shown.text}
          </p>
        </div>
      ) : null}

      {!muted && !speaking && thinking ? (
        <div className="mb-2 rounded-xl border-4 border-panel-outline bg-ink px-3 py-2 shadow-chunk-sm">
          <span className="font-display text-sm font-bold text-panel-outline">
            ...
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default Rival;
