import React from "react";
import type { RoomSnapshot } from "@letter-game/protocol";
import type { UseMatchSetupResult } from "@/hooks/useMatchSetup";
import type { ConnectionStatus } from "@/hooks/useRoom";
import StartScreenMode from "@/components/StartScreen/StartScreenMode";
import StartScreenRounds from "@/components/StartScreen/StartScreenRounds";
import StartScreenRules from "@/components/StartScreen/StartScreenRules";
import RoomSetup from "@/components/Room/RoomSetup";

interface StartScreenProps {
  setup: UseMatchSetupResult;
  roomStatus: ConnectionStatus;
  room: RoomSnapshot | null;
  playerId: string | null;
  roomError: string | null;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
  onLeaveRoom: () => void;
  onStart: () => void;
  children?: React.ReactNode;
}

const StartScreen: React.FC<StartScreenProps> = ({
  setup,
  roomStatus,
  room,
  playerId,
  roomError,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onStart,
  children,
}) => {
  const needsRoom = setup.mode === "party" && room === null;

  return (
    <div className="h-full w-full overflow-y-auto bg-panel-sunk">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
        <div>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-ink">
            Letter Game
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            Blow up falling letters before they hit the bottom.
          </p>
        </div>

        <StartScreenMode mode={setup.mode} onChange={setup.setMode} />

        {setup.mode === "party" ? (
          <RoomSetup
            status={roomStatus}
            room={room}
            playerId={playerId}
            error={roomError}
            onCreate={onCreateRoom}
            onJoin={onJoinRoom}
            onLeave={onLeaveRoom}
          />
        ) : null}

        <div className="rounded-md border-2 border-panel-outline bg-panel p-4">
          <StartScreenRounds
            activeKey={setup.roundKey}
            themedName={setup.themedName}
            onSelect={setup.selectPreset}
          />
        </div>

        {children}

        <div className="rounded-md border-2 border-panel-outline bg-panel p-4">
          <StartScreenRules config={setup.resolved} mode={setup.mode} />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="rounded-md border-2 border-panel-outline bg-action px-6 py-4 font-display text-xl font-bold uppercase tracking-wider text-action-ink shadow-chunk-action transition-colors duration-150 hover:bg-action-lit disabled:opacity-40 disabled:shadow-none"
            onClick={onStart}
            disabled={needsRoom}
          >
            Play
          </button>
          {needsRoom ? (
            <p className="text-center text-xs text-ink-faint">
              Create or join a room first, or switch back to solo.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
