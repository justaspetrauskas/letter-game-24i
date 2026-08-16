import React, { useState } from "react";
import { ROOM_CODE_LENGTH } from "@letter-game/protocol";
import type { RoomSnapshot } from "@letter-game/protocol";
import type { ConnectionStatus } from "@/hooks/useRoom";

interface RoomSetupProps {
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
  offline: "bg-ink-faint",
  connecting: "bg-health-warn",
  online: "bg-health-good",
};

const inputClass =
  "rounded-sm border-2 border-panel-outline bg-panel-sunk px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-action focus:outline-none";

const RoomSetup: React.FC<RoomSetupProps> = ({
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

  return (
    <div className="flex flex-col gap-3 rounded-md border-2 border-panel-outline bg-panel-sunk p-4">
      <div className="flex flex-row items-center justify-between">
        <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-faint">
          Room
        </h3>
        <span className="flex flex-row items-center gap-2 text-xs text-ink-faint">
          <span
            className={`h-2 w-2 rounded-full ${statusDots[status]}`}
            aria-hidden="true"
          />
          {statusLabels[status]}
        </span>
      </div>

      {room === null ? (
        <div className="flex flex-col gap-2">
          <input
            className={inputClass}
            placeholder="Your name"
            value={name}
            maxLength={16}
            onChange={(event) => setName(event.target.value)}
          />
          <button
            type="button"
            className="rounded-sm border-2 border-panel-outline bg-action px-3 py-2 font-display text-sm font-bold uppercase tracking-wider text-action-ink transition-colors duration-150 hover:bg-action-lit"
            onClick={() => onCreate(name)}
          >
            Create room
          </button>
          <div className="flex flex-row gap-2">
            <input
              className={`w-full min-w-0 uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal ${inputClass}`}
              placeholder="Code"
              value={code}
              maxLength={ROOM_CODE_LENGTH}
              onChange={(event) => setCode(event.target.value)}
            />
            <button
              type="button"
              className="shrink-0 rounded-sm border-2 border-panel-outline bg-panel-raised px-3 py-2 font-display text-sm font-bold uppercase tracking-wider text-ink transition-colors duration-150 hover:bg-panel-edge"
              onClick={() => onJoin(code, name)}
            >
              Join
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-baseline justify-between">
            <span className="font-tile text-2xl font-bold tracking-[0.3em] text-action">
              {room.code}
            </span>
            <button
              type="button"
              className="font-display text-xs font-bold uppercase tracking-widest text-ink-faint transition-colors duration-150 hover:text-ink"
              onClick={onLeave}
            >
              Leave
            </button>
          </div>

          <ul className="flex flex-col gap-1 text-sm">
            {room.players.map((player) => (
              <li key={player.id} className="flex flex-row gap-2">
                <span
                  className={
                    player.id === playerId ? "text-ink" : "text-ink-dim"
                  }
                >
                  {player.name}
                  {player.id === playerId ? " (you)" : ""}
                </span>
                {player.isHost ? (
                  <span className="text-xs uppercase tracking-widest text-action">
                    Host
                  </span>
                ) : null}
              </li>
            ))}
          </ul>

          <p className="text-xs leading-relaxed text-ink-faint">
            Everyone here plays seed {room.seed}, so the letters fall in the
            same order for all of you.
          </p>
        </div>
      )}

      {error !== null ? (
        <p className="text-xs leading-relaxed text-danger">{error}</p>
      ) : null}
    </div>
  );
};

export default RoomSetup;
