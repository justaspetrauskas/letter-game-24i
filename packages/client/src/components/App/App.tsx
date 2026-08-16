import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/hooks/useGame";
import { PROGRESS_REPORT_MS } from "@letter-game/protocol";
import type { AttackedPayload, ThemedRound } from "@letter-game/protocol";
import type { GameEvent } from "@letter-game/engine";
import { useRoom } from "@/hooks/useRoom";
import { useThemedRound } from "@/hooks/useThemedRound";
import { useRival } from "@/hooks/useRival";
import { useMatchSetup } from "@/hooks/useMatchSetup";
import Game from "@/components/Game/Game";
import GameHeader from "@/components/GameHeader/GameHeader";
import GameStats from "@/components/GameStats/GameStats";
import Sidebar from "@/components/Sidebar/Sidebar";
import StartScreen from "@/components/StartScreen/StartScreen";
import RoomStandings from "@/components/Room/RoomStandings";
import RoundForge from "@/components/RoundForge/RoundForge";
import Rival from "@/components/Rival/Rival";

type Phase = "menu" | "playing";

const App: React.FC = () => {
  const [phase, setPhase] = useState<Phase>("menu");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [incoming, setIncoming] = useState<AttackedPayload | null>(null);

  const setup = useMatchSetup();
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
    enabled: phase === "playing",
  });

  receiveJunkRef.current = receiveJunk;

  const stateRef = useRef(state);
  stateRef.current = state;

  const roomRef = useRef(room);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const setupConfigRef = useRef(setup.config);

  useEffect(() => {
    setupConfigRef.current = setup.config;
  }, [setup.config]);

  const roomCode = room?.code ?? null;

  useEffect(() => {
    if (roomCode === null || phase !== "playing") {
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
  }, [roomCode, phase, reportProgress]);

  const startMatch = useCallback(() => {
    const current = roomRef.current;
    restart({
      seed: current?.seed,
      config: current?.config ?? setupConfigRef.current,
    });
  }, [restart]);

  const handleStart = useCallback(() => {
    startMatch();
    setDrawerOpen(false);
    setPhase("playing");
  }, [startMatch]);

  const handleExit = useCallback(() => {
    setPhase("menu");
  }, []);

  const handleCreateRoom = useCallback(
    (name: string) => {
      createRoom(name, setupConfigRef.current);
    },
    [createRoom]
  );

  const handleGeneratedRound = useCallback(
    (generated: ThemedRound) => {
      setup.selectThemed(generated);
    },
    [setup.selectThemed]
  );

  const themedRound = useThemedRound({ onRound: handleGeneratedRound });

  useEffect(() => {
    setAiReady(themedRound.available);
  }, [themedRound.available]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-panel-sunk text-ink">
      {phase === "menu" ? (
        <StartScreen
          setup={setup}
          roomStatus={status}
          room={room}
          playerId={playerId}
          roomError={error}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={joinRoom}
          onLeaveRoom={leaveRoom}
          onStart={handleStart}
        >
          <RoundForge
            serverReachable={themedRound.serverReachable}
            available={themedRound.available}
            status={themedRound.status}
            round={themedRound.round}
            error={themedRound.error}
            onGenerate={themedRound.generate}
          />
        </StartScreen>
      ) : (
        <>
          <GameHeader
            state={state}
            drawerOpen={drawerOpen}
            onTogglePause={toggle}
            onRestart={startMatch}
            onToggleDrawer={() => setDrawerOpen((open) => !open)}
          />

          <div className="relative flex-1 overflow-hidden">
            <Game
              state={state}
              onResume={toggle}
              onRestart={startMatch}
              onExit={handleExit}
            />

            <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)}>
              <GameStats state={state}>
                <RoomStandings
                  incoming={incoming}
                  room={room}
                  playerId={playerId}
                />
                <Rival
                  available={themedRound.available}
                  line={rival.line}
                  muted={rival.muted}
                  thinking={rival.thinking}
                  onToggleMute={rival.toggleMute}
                />
              </GameStats>
            </Sidebar>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
