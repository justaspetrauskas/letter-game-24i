import React, { useMemo, useState } from "react";
import { ROOM_CODE_LENGTH } from "@letter-game/protocol";
import type { AttackedPayload, RoomSnapshot } from "@letter-game/protocol";
import type { ConnectionStatus } from "@/hooks/useRoom";

interface RoomProps {
  incoming: AttackedPayload | null;
  status: ConnectionStatus;
  room: RoomSnapshot | null;
  playerId: string | null;
  error: string | null;
  onCreate: (name: string) => void;
  onJoin: (code: string, name: string) => void;
  onLeave: () => void;
}

const statusLabels: Record<ConnectionStatus, string> = {
  offline: "Offline",
  connecting: "Connecting",
  online: "Online",
};

const statusDots: Record<ConnectionStatus, string> = {
  offline: "bg-slate-600",
  connecting: "bg-amber-400",
  online: "bg-emerald-400",
};

const Room: React.FC<RoomProps> = ({
  incoming,
  status,
  room,
  playerId,
  error,
  onCreate,
  onJoin,
  onLeave,
}) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const standings = useMemo(() => {
    if (room === null) {
      return [];
    }
    return [...room.players].sort(
      (left, right) => (right.progress?.score ?? -1) - (left.progress?.score ?? -1)
    );
  }, [room]);

  const handleCreateClick = () => {
    onCreate(name);
  };

  const handleJoinClick = () => {
    onJoin(code, name);
  };

  return (
    <div className="w-full rounded-md border border-slate-700 px-4 py-3">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Room
        </h2>
        <span className="flex flex-row items-center gap-2 text-xs text-slate-400">
          <span
            className={`h-2 w-2 rounded-full ${statusDots[status]}`}
            aria-hidden="true"
          />
          {statusLabels[status]}
        </span>
      </div>

      {room === null ? (
        <div className="mt-3 flex flex-col gap-2">
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
            placeholder="Your name"
            value={name}
            maxLength={16}
            onChange={(event) => setName(event.target.value)}
          />
          <button
            type="button"
            className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950 transition-colors duration-150 hover:bg-emerald-400"
            onClick={handleCreateClick}
          >
            Create room
          </button>
          <div className="flex flex-row gap-2">
            <input
              className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm uppercase tracking-widest text-slate-100 placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
              placeholder="Code"
              value={code}
              maxLength={ROOM_CODE_LENGTH}
              onChange={(event) => setCode(event.target.value)}
            />
            <button
              type="button"
              className="shrink-0 rounded-md border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200 transition-colors duration-150 hover:bg-slate-800"
              onClick={handleJoinClick}
            >
              Join
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-row items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tracking-[0.3em] text-emerald-400">
              {room.code}
            </span>
            <button
              type="button"
              className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors duration-150 hover:text-slate-200"
              onClick={onLeave}
            >
              Leave
            </button>
          </div>

          <ol className="flex flex-col gap-1">
            {standings.map((player, index) => (
              <li
                key={player.id}
                className="flex flex-row items-baseline justify-between gap-2 text-sm"
              >
                <span className="flex min-w-0 flex-row items-baseline gap-2">
                  <span className="w-4 shrink-0 text-xs text-slate-600">
                    {index + 1}
                  </span>
                  <span
                    className={`truncate ${
                      player.id === playerId
                        ? "text-slate-100"
                        : "text-slate-400"
                    }`}
                  >
                    {player.name}
                    {player.id === playerId ? " (you)" : ""}
                  </span>
                  {player.isHost ? (
                    <span className="shrink-0 text-xs uppercase tracking-widest text-emerald-400">
                      Host
                    </span>
                  ) : null}
                </span>

                <span className="shrink-0 font-mono text-xs text-slate-400">
                  {player.progress === null ? (
                    <span className="text-slate-600">—</span>
                  ) : (
                    <>
                      <span className="text-slate-200">
                        {player.progress.score}
                      </span>
                      <span className="text-slate-600">
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
            <p className="rounded-md bg-rose-950/60 px-3 py-2 text-xs leading-relaxed text-rose-300">
              {incoming.from} sent you {incoming.count} letter
              {incoming.count === 1 ? "" : "s"}.
            </p>
          ) : null}

          <p className="text-xs leading-relaxed text-slate-500">
            Everyone here plays seed {room.seed}, plus whatever gets thrown at
            you. Clear {room.config.attackThreshold ?? 4} at once to hit back.
          </p>
        </div>
      )}

      {error !== null ? (
        <p className="mt-3 text-xs leading-relaxed text-rose-400">{error}</p>
      ) : null}
    </div>
  );
};

export default Room;
