import React, { useEffect, useRef, useState } from "react";

interface RivalProps {
  available: boolean;
  line: string | null;
  muted: boolean;
  thinking: boolean;
  timeMs: number;
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

  if (!available || muted) {
    return null;
  }

  const isFresh =
    shown !== null &&
    timeMs >= shown.atMs &&
    timeMs - shown.atMs < LINE_LIFETIME_MS;

  if (!isFresh && !thinking) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-[5] max-w-[min(28rem,60%)]">
      {isFresh ? (
        <div
          key={shown.atMs}
          className="animate-pop rounded-xl border-4 border-panel-outline bg-ink px-4 py-3 shadow-chunk"
        >
          <p className="font-display text-sm font-bold leading-snug text-panel-outline">
            {shown.text}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border-4 border-panel-outline bg-ink px-3 py-2 shadow-chunk-sm">
          <span className="font-display text-sm font-bold text-panel-outline">
            ...
          </span>
        </div>
      )}
    </div>
  );
};

export default Rival;
