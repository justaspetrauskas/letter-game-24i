import React, { useMemo } from "react";
import type { AttackedPayload, RoomSnapshot } from "@letter-game/protocol";

interface RoomStandingsProps {
  incoming: AttackedPayload | null;
  room: RoomSnapshot | null;
  playerId: string | null;
}

const RoomStandings: React.FC<RoomStandingsProps> = ({
  incoming,
  room,
  playerId,
}) => {
  const standings = useMemo(() => {
    if (room === null) {
      return [];
    }
    return [...room.players].sort(
      (left, right) =>
        (right.progress?.score ?? -1) - (left.progress?.score ?? -1)
    );
  }, [room]);

  if (room === null) {
    return null;
  }

  return (
    <div className="lg-inset flex w-full flex-col gap-3 p-3">
      <div className="flex flex-row items-baseline justify-between">
        <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-faint">
          Standings
        </h3>
        <span className="font-tile text-xs tracking-[0.2em] text-action">
          {room.code}
        </span>
      </div>

      <ol className="flex flex-col gap-1">
        {standings.map((player, index) => (
          <li
            key={player.id}
            className="flex flex-row items-baseline justify-between gap-2 text-sm"
          >
            <span className="flex min-w-0 flex-row items-baseline gap-2">
              <span className="w-4 shrink-0 text-xs text-ink-faint">
                {index + 1}
              </span>
              <span
                className={`truncate ${
                  player.id === playerId ? "text-ink" : "text-ink-dim"
                }`}
              >
                {player.name}
                {player.id === playerId ? " (you)" : ""}
              </span>
            </span>

            <span className="shrink-0 font-tile text-xs text-ink-dim">
              {player.progress === null ? (
                <span className="text-ink-faint">—</span>
              ) : (
                <>
                  <span className="text-ink">{player.progress.score}</span>
                  <span className="text-ink-faint">
                    {player.progress.finished
                      ? " out"
                      : ` ♥${player.progress.lives}`}
                  </span>
                </>
              )}
            </span>
          </li>
        ))}
      </ol>

      {incoming !== null ? (
        <p className="rounded-sm bg-dyn/25 px-3 py-2 text-xs leading-relaxed text-dyn-lit">
          {incoming.from} sent you {incoming.count} letter
          {incoming.count === 1 ? "" : "s"}.
        </p>
      ) : null}
    </div>
  );
};

export default RoomStandings;
