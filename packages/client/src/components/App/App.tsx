import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/hooks/useGame";
import type { RestartOptions } from "@/hooks/useGame";
import { PROGRESS_REPORT_MS } from "@letter-game/protocol";
import type { AttackedPayload, ThemedRound } from "@letter-game/protocol";
import type { GameEvent } from "@letter-game/engine";
import { useRoom } from "@/hooks/useRoom";
import { useThemedRound } from "@/hooks/useThemedRound";
import { useRival } from "@/hooks/useRival";
import Game from "@/components/Game/Game";
import GameStats from "@/components/GameStats/GameStats";
import Room from "@/components/Room/Room";
import RoundForge from "@/components/RoundForge/RoundForge";
import Rival from "@/components/Rival/Rival";

const App: React.FC = () => {
  const [aiReady, setAiReady] = useState(false);
  const [incoming, setIncoming] = useState<AttackedPayload | null>(null);
  const rival = useRival({ enabled: aiReady });

  const receiveJunkRef = useRef<(count: number) => void>(() => undefined);

  const handleAttacked = useCallback((payload: AttackedPayload) => {
    receiveJunkRef.current(payload.count);
    setIncoming(payload);
  }, []);

  const {
    status,
    room,
    playerId,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    reportProgress,
    sendAttack,
  } = useRoom({ onAttacked: handleAttacked });

  const handleEvents = useCallback(
    (events: GameEvent[]) => {
      rival.observe(events);
      for (const event of events) {
        if (event.type === "clear" && event.attack > 0) {
          sendAttack(event.attack);
        }
      }
    },
    [rival.observe, sendAttack]
  );

  const { state, toggle, restart, receiveJunk } = useGame({
    onEvents: handleEvents,
  });

  receiveJunkRef.current = receiveJunk;

  const stateRef = useRef(state);
  stateRef.current = state;

  const roomRef = useRef(room);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const roomCode = room?.code ?? null;
  const roomSeed = room?.seed ?? null;

  useEffect(() => {
    if (room === null) {
      return;
    }
    restart({ seed: room.seed, config: room.config });
  }, [roomCode, roomSeed, restart]);

  useEffect(() => {
    if (roomCode === null) {
      return;
    }

    const timer = window.setInterval(() => {
      const current = stateRef.current;
      reportProgress({
        score: current.score,
        lives: current.lives,
        level: current.level,
        cleared: current.cleared,
        missed: current.missed,
        finished: current.status === "finished",
      });
    }, PROGRESS_REPORT_MS);

    return () => window.clearInterval(timer);
  }, [roomCode, reportProgress]);

  const handleRestart = useCallback(
    (options?: RestartOptions) => {
      restart({ seed: roomRef.current?.seed, config: options?.config });
    },
    [restart]
  );

  const handleOverlayRestart = useCallback(() => {
    handleRestart();
  }, [handleRestart]);

  const handleGeneratedRound = useCallback(
    (generated: ThemedRound) => {
      handleRestart({ config: generated.config });
    },
    [handleRestart]
  );

  const themedRound = useThemedRound({ onRound: handleGeneratedRound });

  useEffect(() => {
    setAiReady(themedRound.available);
  }, [themedRound.available]);

  return (
    <div className="flex h-screen w-full flex-row overflow-hidden bg-slate-900 text-slate-100">
      <Game state={state} onResume={toggle} onRestart={handleOverlayRestart} />
      <GameStats state={state} onTogglePause={toggle} onRestart={handleRestart}>
        <Rival
          available={themedRound.available}
          line={rival.line}
          muted={rival.muted}
          thinking={rival.thinking}
          onToggleMute={rival.toggleMute}
        />
        <RoundForge
          serverReachable={themedRound.serverReachable}
          available={themedRound.available}
          status={themedRound.status}
          round={themedRound.round}
          error={themedRound.error}
          onGenerate={themedRound.generate}
        />
        <Room
          incoming={incoming}
          status={status}
          room={room}
          playerId={playerId}
          error={error}
          onCreate={createRoom}
          onJoin={joinRoom}
          onLeave={leaveRoom}
        />
      </GameStats>
    </div>
  );
};

export default App;
